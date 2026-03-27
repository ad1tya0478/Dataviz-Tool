import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import io

from utils.data_processor import save_dataframe, dataframe_info, df_preview

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Accept a CSV or XLSX file, parse it into a dataframe,
    store it in memory, and return a preview + metadata.
    """
    filename = file.filename or ""

    # Validate file extension
    if not (filename.endswith(".csv") or filename.endswith(".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a .csv or .xlsx file.",
        )

    contents = await file.read()

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    try:
        if filename.endswith(".csv"):
            # Try common encodings in order
            for encoding in ("utf-8", "latin-1", "cp1252"):
                try:
                    df = pd.read_csv(io.BytesIO(contents), encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise HTTPException(status_code=400, detail="Could not decode CSV file.")
        else:
            df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="The file contains no data rows.")

    # Store in memory
    save_dataframe(df, filename)

    info = dataframe_info(df)
    preview = df_preview(df, max_rows=100)

    return JSONResponse(content={"info": info, "preview": preview})
