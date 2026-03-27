# DataViz — CSV/Excel Analysis Tool

Upload a CSV or Excel file, filter and clean the data, visualize it with charts, and export the result. No sign-up, no cloud — runs entirely on your machine.

---

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer
- npm

---

## Setup & Run

### 1. Clone / download the project

```
project/
  backend/
  frontend/
```

---

### 2. Backend

```bash
cd project/backend

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server (runs on http://localhost:8000)
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### 3. Frontend

Open a **new terminal tab/window**:

```bash
cd project/frontend

# Install dependencies
npm install

# Start the React dev server (runs on http://localhost:3000)
npm start
```

Your browser will open `http://localhost:3000` automatically.

---

## How to Use

### Upload
- Go to the **Upload** tab.
- Drag and drop a `.csv` or `.xlsx` file, or click to browse.
- Only `.csv` and `.xlsx` are accepted — anything else shows an error.

### Preview
- After upload, click **Preview** to see the first 100 rows in a paginated table.
- Column names and detected types (numeric / text / datetime) are shown above the table.

### Filter & Clean
- **Filters**: Add one or more conditions (equals, contains, greater than, is null, etc.). All filters apply with AND logic. Click **Apply**.
- **Sort**: Pick a column and direction, then click **Apply Sort**.
- **Column Visibility**: Check/uncheck columns to show or hide them in the preview.
- **Drop Column**: Permanently removes a column from the working dataset.
- **Remove Duplicate Rows**: Drops exact duplicate rows.
- **Drop Rows with Nulls**: Removes any row that has at least one missing value.
- **Fill Nulls**: Replace missing values with mean, median, mode, or a custom value.
- **Export Filtered CSV**: Downloads the current filtered/cleaned dataset as a `.csv` file.

### Visualize
- Select a chart type: Bar, Line, Pie, Scatter, Histogram, or Heatmap.
- Choose X and Y axis columns (where applicable).
- Give the chart an optional title.
- Click **Render Chart**.
- Click **Download PNG** to save the chart image.

> The Heatmap (correlation matrix) is rendered server-side using Matplotlib/Seaborn and returned as an image. All other charts use Chart.js in the browser.

### Statistics
- Click **Compute Statistics** to see count, mean, median, std deviation, min, and max for every numeric column.

---

## Notes

- The backend holds the dataset **in memory** for the current session. Restarting the backend clears it.
- For very large files (>100k rows), the preview is capped at 100 rows, but all operations (filter, clean, stats, charts) run on the full dataset.
- Mixed-type columns (e.g. a column with numbers and text) are treated as text. Numeric operations on such columns are silently skipped.
- The backend runs on port **8000**, the frontend on port **3000**. Make sure both ports are free before starting.

---

## Project Structure

```
project/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── routes/
│   │   ├── upload.py            # /api/upload
│   │   ├── filter.py            # /api/filter, /api/export, cleaning ops
│   │   ├── visualize.py         # /api/visualize
│   │   └── stats.py             # /api/stats
│   └── utils/
│       ├── data_processor.py    # All pandas logic
│       └── chart_generator.py   # Matplotlib heatmap
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx              # Root component + state
        ├── App.css              # All styles
        ├── api/
        │   └── api.js           # Axios calls to backend
        └── components/
            ├── Navbar.jsx
            ├── FileUpload.jsx
            ├── DataTable.jsx
            ├── FilterPanel.jsx
            ├── VisualizationPanel.jsx
            └── StatsPanel.jsx
```
