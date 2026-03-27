import React, { useState } from "react";

const PAGE_SIZE = 20;

export default function DataTable({ info, preview, onDataUpdate }) {
  const [page, setPage] = useState(1);

  if (!info) {
    return <div className="loading">No dataset loaded.</div>;
  }

  const totalPages = Math.ceil(preview.length / PAGE_SIZE);
  const rows = preview.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columns = info.columns.map((c) => c.name);

  return (
    <div>
      <div className="section-title">Dataset Preview</div>

      {/* Meta info */}
      <div className="meta-row">
        <span>File: <strong>{info.filename}</strong></span>
        <span>Rows: <strong>{info.rows}</strong></span>
        <span>Columns: <strong>{info.cols}</strong></span>
        {preview.length < info.rows && (
          <span style={{ color: "var(--muted)" }}>
            (showing first {preview.length} rows)
          </span>
        )}
      </div>

      {/* Column type legend */}
      <div className="card">
        <div className="card-title">Column Types</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {info.columns.map((col) => (
            <div key={col.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 12 }}>{col.name}</span>
              <span className={`tag ${col.kind === "numeric" ? "tag-numeric" : "tag-text"}`}>
                {col.kind}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ color: "var(--muted)", width: 40 }}>#</th>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--muted)" }}>
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col} title={row[col] == null ? "null" : String(row[col])}>
                      {row[col] == null ? (
                        <span style={{ color: "var(--muted)", fontStyle: "italic" }}>null</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{ padding: "10px 14px" }}>
            <button
              className="btn btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
