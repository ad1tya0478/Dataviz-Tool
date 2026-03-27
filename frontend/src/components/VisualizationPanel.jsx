import React, { useState, useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie, Scatter } from "react-chartjs-2";
import { getChart } from "../api/api";

// Register all Chart.js components we need
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "scatter", label: "Scatter Plot" },
  { value: "histogram", label: "Histogram" },
  { value: "heatmap", label: "Heatmap (Correlation)" },
];

// Minimal color palette — just blue shades + grays
const COLORS = [
  "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd",
  "#1d4ed8", "#1e40af", "#1e3a8a", "#bfdbfe",
  "#475569", "#64748b", "#94a3b8", "#cbd5e1",
];

function buildChartJsData(data, chartType) {
  if (chartType === "pie") {
    return {
      labels: data.labels,
      datasets: [
        {
          data: data.datasets[0].data,
          backgroundColor: COLORS.slice(0, data.labels.length),
          borderWidth: 1,
          borderColor: "#fff",
        },
      ],
    };
  }
  if (chartType === "scatter") {
    return {
      datasets: [
        {
          label: data.datasets[0].label,
          data: data.datasets[0].data,
          backgroundColor: "#2563eb99",
          pointRadius: 4,
        },
      ],
    };
  }
  // bar / line / histogram
  return {
    labels: data.labels,
    datasets: [
      {
        label: data.datasets[0].label,
        data: data.datasets[0].data,
        backgroundColor: "#2563eb99",
        borderColor: "#2563eb",
        borderWidth: 1.5,
        pointRadius: chartType === "line" ? 3 : undefined,
        fill: false,
      },
    ],
  };
}

const BASE_OPTIONS = (title) => ({
  responsive: true,
  plugins: {
    legend: { display: true, labels: { font: { family: "'IBM Plex Mono', monospace", size: 11 } } },
    title: {
      display: !!title,
      text: title,
      font: { family: "'IBM Plex Mono', monospace", size: 13, weight: "bold" },
    },
  },
  scales: {
    x: { ticks: { font: { family: "'IBM Plex Mono', monospace", size: 10 } } },
    y: { ticks: { font: { family: "'IBM Plex Mono', monospace", size: 10 } } },
  },
});

export default function VisualizationPanel({ info, filters }) {
  const [chartType, setChartType] = useState("bar");
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [title, setTitle] = useState("");
  const [chartData, setChartData] = useState(null); // { type, ...payload }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chartRef = useRef(null);

  const columns = info?.columns || [];
  const colNames = columns.map((c) => c.name);
  const numericCols = columns.filter((c) => c.kind === "numeric").map((c) => c.name);

  // Reset axis selections when chart type changes
  useEffect(() => {
    setXCol("");
    setYCol("");
    setChartData(null);
    setError("");
  }, [chartType]);

  const needsX = true; // all charts need at least X
  const needsY = ["bar", "line", "scatter"].includes(chartType);
  const xOptions = chartType === "scatter" ? numericCols : colNames;
  const yOptions = numericCols;

  const render = async () => {
    setLoading(true);
    setError("");
    setChartData(null);
    try {
      const payload = {
        chart_type: chartType,
        x_column: xCol || null,
        y_column: yCol || null,
        title: title || chartType,
        filters: filters.map(({ column, operator, value }) => ({
          column,
          operator,
          value,
        })),
      };
      const res = await getChart(payload);
      setChartData(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Chart generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Download chart as PNG
  const download = () => {
    if (chartData?.type === "image") {
      // Heatmap — base64 PNG from server
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${chartData.data}`;
      a.download = `${chartData.title || "chart"}.png`;
      a.click();
    } else if (chartRef.current) {
      // Chart.js canvas
      const canvas = chartRef.current.canvas;
      if (!canvas) return;
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${title || chartType}.png`;
      a.click();
    }
  };

  if (!info) return <div className="loading">No dataset loaded.</div>;

  return (
    <div>
      <div className="section-title">Visualize</div>

      {/* Controls */}
      <div className="card">
        <div className="card-title">Chart Settings</div>

        <div className="field-row" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Chart type */}
          <div className="field">
            <label>Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              style={{ minWidth: 170 }}
            >
              {CHART_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>

          {/* X axis */}
          {chartType !== "heatmap" && (
            <div className="field">
              <label>
                {chartType === "histogram" ? "Column" : "X Axis"}
              </label>
              <select
                value={xCol}
                onChange={(e) => setXCol(e.target.value)}
                style={{ minWidth: 160 }}
              >
                <option value="">— select —</option>
                {xOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Y axis */}
          {needsY && chartType !== "heatmap" && (
            <div className="field">
              <label>Y Axis</label>
              <select
                value={yCol}
                onChange={(e) => setYCol(e.target.value)}
                style={{ minWidth: 160 }}
              >
                <option value="">— select —</option>
                {yOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="field">
            <label>Chart Title</label>
            <input
              type="text"
              placeholder="Optional title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ minWidth: 160 }}
            />
          </div>

          <div className="field" style={{ alignSelf: "flex-end" }}>
            <button className="btn btn-primary" onClick={render} disabled={loading}>
              {loading ? "Rendering…" : "Render Chart"}
            </button>
          </div>
        </div>

        {/* Hint text */}
        {chartType === "heatmap" && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            Heatmap uses all numeric columns automatically.
          </div>
        )}
        {chartType === "pie" && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            Select a categorical column for X. Top 20 values will be shown.
          </div>
        )}
        {chartType === "scatter" && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            Both axes must be numeric columns.
          </div>
        )}
      </div>

      {error && <div className="msg msg-error">{error}</div>}
      {loading && <div className="loading">Rendering chart…</div>}

      {/* Chart output */}
      {chartData && (
        <div className="chart-box">
          {chartData.type === "image" ? (
            // Heatmap — server-rendered PNG
            <img
              src={`data:image/png;base64,${chartData.data}`}
              alt={chartData.title}
              style={{ maxWidth: "100%", maxHeight: 520 }}
            />
          ) : (
            // Chart.js
            <div style={{ width: "100%", maxHeight: 460 }}>
              {(chartData.chart_type === "bar" || chartData.chart_type === "histogram") && (
                <Bar
                  ref={chartRef}
                  data={buildChartJsData(chartData, chartData.chart_type)}
                  options={BASE_OPTIONS(chartData.title)}
                />
              )}
              {chartData.chart_type === "line" && (
                <Line
                  ref={chartRef}
                  data={buildChartJsData(chartData, "line")}
                  options={BASE_OPTIONS(chartData.title)}
                />
              )}
              {chartData.chart_type === "pie" && (
                <Pie
                  ref={chartRef}
                  data={buildChartJsData(chartData, "pie")}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "right",
                        labels: { font: { family: "'IBM Plex Mono', monospace", size: 11 } },
                      },
                      title: {
                        display: !!chartData.title,
                        text: chartData.title,
                        font: { family: "'IBM Plex Mono', monospace", size: 13, weight: "bold" },
                      },
                    },
                  }}
                />
              )}
              {chartData.chart_type === "scatter" && (
                <Scatter
                  ref={chartRef}
                  data={buildChartJsData(chartData, "scatter")}
                  options={BASE_OPTIONS(chartData.title)}
                />
              )}
            </div>
          )}

          {/* Download button */}
          <button
            className="btn btn-sm"
            style={{ marginTop: 14 }}
            onClick={download}
          >
            ↓ Download PNG
          </button>
        </div>
      )}
    </div>
  );
}
