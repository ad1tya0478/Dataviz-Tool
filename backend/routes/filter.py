from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from typing import Optional

from utils.data_processor import (
    get_dataframe,
    update_dataframe,
    apply_filters,
    sort_dataframe,
    remove_duplicates,
    drop_nulls,
    fill_nulls,
    drop_column,
    dataframe_info,
    df_preview,
    df_to_csv_bytes,
)

router = APIRouter()


def _require_df():
    df = get_dataframe()
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload a file first.")
    return df


# ── Filter & Sort ───────────────────────────────────────────────────────────

class FilterRequest(BaseModel):
    filters: list[dict] = []
    sort_column: Optional[str] = None
    sort_ascending: bool = True
    visible_columns: Optional[list[str]] = None  # columns to show; None = show all


@router.post("/filter")
def filter_data(req: FilterRequest):
    """Apply filters + sort to the stored dataframe and return a preview."""
    df = _require_df()

    # Apply filters
    if req.filters:
        df = apply_filters(df, req.filters)

    # Apply sort
    if req.sort_column:
        df = sort_dataframe(df, req.sort_column, req.sort_ascending)

    # Column visibility (doesn't mutate stored df)
    if req.visible_columns:
        valid = [c for c in req.visible_columns if c in df.columns]
        df = df[valid]

    preview = df_preview(df, max_rows=100)
    return JSONResponse(content={"preview": preview, "total_rows": len(df)})


# ── Column drop (permanent on stored df) ────────────────────────────────────

class DropColumnRequest(BaseModel):
    column: str


@router.post("/drop-column")
def drop_col(req: DropColumnRequest):
    df = _require_df()
    df = drop_column(df, req.column)
    update_dataframe(df)
    info = dataframe_info(df)
    preview = df_preview(df, max_rows=100)
    return JSONResponse(content={"info": info, "preview": preview})


# ── Data cleaning ────────────────────────────────────────────────────────────

@router.post("/remove-duplicates")
def remove_dups():
    df = _require_df()
    before = len(df)
    df = remove_duplicates(df)
    after = len(df)
    update_dataframe(df)
    return JSONResponse(content={"removed": before - after, "rows": after, "preview": df_preview(df)})


@router.post("/drop-nulls")
def drop_null_rows():
    df = _require_df()
    before = len(df)
    df = drop_nulls(df)
    after = len(df)
    update_dataframe(df)
    return JSONResponse(content={"removed": before - after, "rows": after, "preview": df_preview(df)})


class FillNullsRequest(BaseModel):
    strategy: str  # mean | median | mode | custom
    custom_value: Optional[str] = None


@router.post("/fill-nulls")
def fill_null_vals(req: FillNullsRequest):
    df = _require_df()
    df = fill_nulls(df, req.strategy, req.custom_value)
    update_dataframe(df)
    return JSONResponse(content={"rows": len(df), "preview": df_preview(df)})


# ── Export ───────────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    filters: list[dict] = []
    sort_column: Optional[str] = None
    sort_ascending: bool = True
    visible_columns: Optional[list[str]] = None


@router.post("/export")
def export_csv(req: ExportRequest):
    """Apply current filters and return the result as a downloadable CSV."""
    df = _require_df()

    if req.filters:
        df = apply_filters(df, req.filters)
    if req.sort_column:
        df = sort_dataframe(df, req.sort_column, req.sort_ascending)
    if req.visible_columns:
        valid = [c for c in req.visible_columns if c in df.columns]
        df = df[valid]

    csv_bytes = df_to_csv_bytes(df)
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=filtered_data.csv"},
    )
