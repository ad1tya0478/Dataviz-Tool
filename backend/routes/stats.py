from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from utils.data_processor import get_dataframe, compute_stats

router = APIRouter()


@router.get("/stats")
def get_stats():
    """Return descriptive statistics for all numeric columns."""
    df = get_dataframe()
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    stats = compute_stats(df)
    if not stats:
        raise HTTPException(status_code=400, detail="No numeric columns found in the dataset.")
    return JSONResponse(content={"stats": stats})
