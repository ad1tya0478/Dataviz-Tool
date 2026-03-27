import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from utils.data_processor import get_dataframe, apply_filters
from utils.chart_generator import generate_heatmap

router = APIRouter()

CHART_TYPES = {"bar", "line", "pie", "scatter", "histogram", "heatmap"}


class ChartRequest(BaseModel):
    chart_type: str
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    title: str = ""
    filters: list[dict] = []  # apply active filters before charting


@router.post("/visualize")
def visualize(req: ChartRequest):
    df = get_dataframe()
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    if req.chart_type not in CHART_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown chart type: {req.chart_type}")

    # Apply active filters so chart reflects the current filtered view
    if req.filters:
        df = apply_filters(df, req.filters)

    if df.empty:
        raise HTTPException(status_code=400, detail="No data after applying filters.")

    title = req.title or req.chart_type.capitalize()

    # ── Heatmap (server-rendered PNG) ────────────────────────────────────────
    if req.chart_type == "heatmap":
        try:
            img_b64 = generate_heatmap(df, title)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        return JSONResponse(content={"type": "image", "data": img_b64, "title": title})

    # ── All other chart types — send data to Chart.js on frontend ────────────
    x_col = req.x_column
    y_col = req.y_column

    # Validate columns
    if req.chart_type != "histogram" and x_col and x_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{x_col}' not found.")
    if y_col and y_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{y_col}' not found.")

    # Replace NaN so JSON stays valid
    df = df.replace({np.nan: None, np.inf: None, -np.inf: None})

    payload: dict = {"type": "chartjs", "chart_type": req.chart_type, "title": title}

    if req.chart_type == "histogram":
        if not x_col:
            raise HTTPException(status_code=400, detail="Histogram requires an X column.")
        series = pd.to_numeric(df[x_col], errors="coerce").dropna()
        counts, edges = np.histogram(series, bins=20)
        labels = [f"{edges[i]:.2f}–{edges[i+1]:.2f}" for i in range(len(counts))]
        payload["labels"] = labels
        payload["datasets"] = [{"label": x_col, "data": counts.tolist()}]

    elif req.chart_type == "pie":
        if not x_col:
            raise HTTPException(status_code=400, detail="Pie chart requires an X (category) column.")
        counts = df[x_col].astype(str).value_counts().head(20)
        payload["labels"] = counts.index.tolist()
        payload["datasets"] = [{"data": counts.values.tolist()}]

    elif req.chart_type == "scatter":
        if not x_col or not y_col:
            raise HTTPException(status_code=400, detail="Scatter plot requires both X and Y columns.")
        x_vals = pd.to_numeric(df[x_col], errors="coerce")
        y_vals = pd.to_numeric(df[y_col], errors="coerce")
        mask = x_vals.notna() & y_vals.notna()
        points = [{"x": float(x), "y": float(y)} for x, y in zip(x_vals[mask], y_vals[mask])]
        payload["datasets"] = [{"label": f"{x_col} vs {y_col}", "data": points}]

    elif req.chart_type in ("bar", "line"):
        if not x_col or not y_col:
            raise HTTPException(status_code=400, detail=f"{req.chart_type.capitalize()} chart requires both X and Y columns.")
        # Group by x and aggregate y (mean) to avoid massive datasets
        x_vals = df[x_col].astype(str)
        y_vals = pd.to_numeric(df[y_col], errors="coerce")
        grouped = pd.DataFrame({"x": x_vals, "y": y_vals}).groupby("x")["y"].mean()
        # Limit to top 50 labels for readability
        grouped = grouped.head(50)
        payload["labels"] = grouped.index.tolist()
        payload["datasets"] = [{"label": y_col, "data": [round(v, 4) if v is not None else None for v in grouped.values.tolist()]}]

    return JSONResponse(content=payload)
