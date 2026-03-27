import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend — must be set before pyplot import
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64


def _fig_to_base64(fig) -> str:
    """Convert a Matplotlib figure to a base64-encoded PNG string."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return encoded


def generate_heatmap(df: pd.DataFrame, title: str = "Correlation Matrix") -> str:
    """
    Compute Pearson correlation of all numeric columns and render as a seaborn heatmap.
    Returns base64-encoded PNG.
    """
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        raise ValueError("Need at least 2 numeric columns to generate a heatmap.")

    corr = numeric_df.corr()

    fig, ax = plt.subplots(figsize=(max(6, corr.shape[1]), max(5, corr.shape[0] - 1)))
    sns.heatmap(
        corr,
        annot=True,
        fmt=".2f",
        cmap="coolwarm",
        ax=ax,
        linewidths=0.5,
        square=True,
        cbar_kws={"shrink": 0.8},
    )
    ax.set_title(title, fontsize=13, pad=12)
    fig.tight_layout()
    return _fig_to_base64(fig)
