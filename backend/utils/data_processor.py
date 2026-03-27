import pandas as pd
import numpy as np
import io

# In-memory store for the uploaded dataframe (single session, single dataset)
_store: dict = {"df": None, "filename": None}


def save_dataframe(df: pd.DataFrame, filename: str):
    """Persist a dataframe to the in-memory store."""
    _store["df"] = df.copy()
    _store["filename"] = filename


def get_dataframe() -> pd.DataFrame | None:
    """Return the currently stored dataframe, or None if nothing uploaded yet."""
    if _store["df"] is None:
        return None
    return _store["df"].copy()


def update_dataframe(df: pd.DataFrame):
    """Overwrite the stored dataframe (used after destructive operations like drop column)."""
    _store["df"] = df.copy()


def dataframe_info(df: pd.DataFrame) -> dict:
    """Return metadata about the dataframe: columns, dtypes, shape."""
    col_info = []
    for col in df.columns:
        dtype = str(df[col].dtype)
        # Map pandas dtypes to friendlier names
        if "int" in dtype or "float" in dtype:
            kind = "numeric"
        elif "datetime" in dtype:
            kind = "datetime"
        elif "bool" in dtype:
            kind = "boolean"
        else:
            kind = "text"
        col_info.append({"name": col, "dtype": dtype, "kind": kind})

    return {
        "filename": _store["filename"],
        "rows": len(df),
        "cols": len(df.columns),
        "columns": col_info,
    }


def apply_filters(df: pd.DataFrame, filters: list[dict]) -> pd.DataFrame:
    """
    Apply a list of filter conditions (AND logic) to the dataframe.
    Each filter dict: { "column": str, "operator": str, "value": any }
    """
    for f in filters:
        col = f["column"]
        op = f["operator"]
        val = f.get("value", None)

        if col not in df.columns:
            continue

        if op == "eq":
            df = df[df[col] == _coerce(df[col], val)]
        elif op == "neq":
            df = df[df[col] != _coerce(df[col], val)]
        elif op == "gt":
            df = df[pd.to_numeric(df[col], errors="coerce") > float(val)]
        elif op == "lt":
            df = df[pd.to_numeric(df[col], errors="coerce") < float(val)]
        elif op == "gte":
            df = df[pd.to_numeric(df[col], errors="coerce") >= float(val)]
        elif op == "lte":
            df = df[pd.to_numeric(df[col], errors="coerce") <= float(val)]
        elif op == "contains":
            df = df[df[col].astype(str).str.contains(str(val), case=False, na=False)]
        elif op == "not_contains":
            df = df[~df[col].astype(str).str.contains(str(val), case=False, na=False)]
        elif op == "is_null":
            df = df[df[col].isna()]
        elif op == "not_null":
            df = df[df[col].notna()]

    return df


def _coerce(series: pd.Series, value):
    """Try to cast the filter value to match the series dtype."""
    dtype = str(series.dtype)
    try:
        if "int" in dtype:
            return int(value)
        if "float" in dtype:
            return float(value)
    except (ValueError, TypeError):
        pass
    return value


def sort_dataframe(df: pd.DataFrame, column: str, ascending: bool) -> pd.DataFrame:
    """Sort dataframe by a single column."""
    if column not in df.columns:
        return df
    return df.sort_values(by=column, ascending=ascending)


def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    return df.drop_duplicates()


def drop_nulls(df: pd.DataFrame) -> pd.DataFrame:
    return df.dropna()


def fill_nulls(df: pd.DataFrame, strategy: str, custom_value: str = None) -> pd.DataFrame:
    """Fill null values using mean, median, mode, or a custom value."""
    df = df.copy()
    if strategy == "mean":
        for col in df.select_dtypes(include=[np.number]).columns:
            df[col] = df[col].fillna(df[col].mean())
    elif strategy == "median":
        for col in df.select_dtypes(include=[np.number]).columns:
            df[col] = df[col].fillna(df[col].median())
    elif strategy == "mode":
        for col in df.columns:
            mode_vals = df[col].mode()
            if not mode_vals.empty:
                df[col] = df[col].fillna(mode_vals[0])
    elif strategy == "custom" and custom_value is not None:
        df = df.fillna(custom_value)
    return df


def drop_column(df: pd.DataFrame, column: str) -> pd.DataFrame:
    if column in df.columns:
        return df.drop(columns=[column])
    return df


def compute_stats(df: pd.DataFrame) -> list[dict]:
    """Compute descriptive stats for all numeric columns."""
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return []

    stats = []
    for col in numeric_df.columns:
        s = numeric_df[col].dropna()
        stats.append({
            "column": col,
            "count": int(s.count()),
            "mean": round(float(s.mean()), 4) if not s.empty else None,
            "median": round(float(s.median()), 4) if not s.empty else None,
            "std": round(float(s.std()), 4) if not s.empty else None,
            "min": round(float(s.min()), 4) if not s.empty else None,
            "max": round(float(s.max()), 4) if not s.empty else None,
        })
    return stats


def df_to_csv_bytes(df: pd.DataFrame) -> bytes:
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    return buffer.getvalue().encode("utf-8")


def df_preview(df: pd.DataFrame, max_rows: int = 100) -> list[dict]:
    """Convert first N rows to JSON-serialisable records, handling NaN/Inf."""
    preview = df.head(max_rows).copy()
    # Replace NaN / Inf with None so JSON serialisation doesn't break
    preview = preview.replace({np.nan: None, np.inf: None, -np.inf: None})
    return preview.to_dict(orient="records")
