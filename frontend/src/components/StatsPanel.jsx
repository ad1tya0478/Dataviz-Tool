import React, { useState } from "react";
import { getStats } from "../api/api";

export default function StatsPanel({ info }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStats();
      setStats(res.data.stats);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to load stats.");
    } finally {
      setLoading(false);
    }
  };

  if (!info) return <div className="loading">No dataset loaded.</div>;

  return (
    <div>
      <div className="section-title">Summary Statistics</div>

      {!stats && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 12 }}>
            Compute descriptive statistics for all numeric columns.
          </p>
          <button className="btn btn-primary" onClick={load} disabled={loading}>
            {loading ? "Computing…" : "Compute Statistics"}
          </button>
        </div>
      )}

      {error && <div className="msg msg-error">{error}</div>}
      {loading && <div className="loading">Computing…</div>}

      {stats && (
        <>
          <div style={{ marginBottom: 14, display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={load} disabled={loading}>
              Refresh
            </button>
          </div>
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.column} className="stat-card">
                <h4>{s.column}</h4>
                <div className="stat-row"><span>Count</span><span>{s.count}</span></div>
                <div className="stat-row"><span>Mean</span><span>{s.mean ?? "—"}</span></div>
                <div className="stat-row"><span>Median</span><span>{s.median ?? "—"}</span></div>
                <div className="stat-row"><span>Std Dev</span><span>{s.std ?? "—"}</span></div>
                <div className="stat-row"><span>Min</span><span>{s.min ?? "—"}</span></div>
                <div className="stat-row"><span>Max</span><span>{s.max ?? "—"}</span></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
