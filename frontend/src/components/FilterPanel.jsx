import React, { useState } from "react";
import {
  filterData,
  removeDuplicates,
  dropNulls,
  fillNulls,
  dropColumn,
  exportCsv,
} from "../api/api";
import DataTable from "./DataTable";

const OPERATORS = [
  { value: "eq", label: "= Equal to" },
  { value: "neq", label: "≠ Not equal to" },
  { value: "gt", label: "> Greater than" },
  { value: "lt", label: "< Less than" },
  { value: "gte", label: "≥ Greater or equal" },
  { value: "lte", label: "≤ Less or equal" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does not contain" },
  { value: "is_null", label: "Is null" },
  { value: "not_null", label: "Is not null" },
];

const NO_VALUE_OPS = ["is_null", "not_null"];

export default function FilterPanel({
  info,
  preview,
  setPreview,
  filters,
  setFilters,
  sortColumn,
  setSortColumn,
  sortAscending,
  setSortAscending,
  visibleColumns,
  setVisibleColumns,
  onDataUpdate,
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { type, text }
  const [totalRows, setTotalRows] = useState(info?.rows || 0);

  // Fill-nulls state
  const [fillStrategy, setFillStrategy] = useState("mean");
  const [fillCustom, setFillCustom] = useState("");

  // Column to drop
  const [dropCol, setDropCol] = useState("");

  // Filtered preview state (local copy so table updates without re-uploading)
  const [filteredPreview, setFilteredPreview] = useState(null);

  const columns = info?.columns || [];
  const allColNames = columns.map((c) => c.name);

  // If visibleColumns not set yet, default to all
  const shown = visibleColumns || allColNames;

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // ── Add / remove filters ──────────────────────────────────────────────
  const addFilter = () => {
    setFilters([
      ...filters,
      { id: Date.now(), column: allColNames[0] || "", operator: "eq", value: "" },
    ]);
  };

  const removeFilter = (id) => setFilters(filters.filter((f) => f.id !== id));

  const updateFilter = (id, key, val) =>
    setFilters(filters.map((f) => (f.id === id ? { ...f, [key]: val } : f)));

  // ── Apply filters ─────────────────────────────────────────────────────
  const applyFilters = async () => {
    setLoading(true);
    try {
      const payload = {
        filters: filters.map(({ column, operator, value }) => ({
          column,
          operator,
          value,
        })),
        sort_column: sortColumn || null,
        sort_ascending: sortAscending,
        visible_columns: visibleColumns,
      };
      const res = await filterData(payload);
      setFilteredPreview(res.data.preview);
      setTotalRows(res.data.total_rows);
      showMsg("success", `${res.data.total_rows} rows after filtering.`);
    } catch (e) {
      showMsg("error", e.response?.data?.detail || "Filter failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters([]);
    setSortColumn("");
    setSortAscending(true);
    setVisibleColumns(null);
    setFilteredPreview(null);
    setTotalRows(info?.rows || 0);
  };

  // ── Cleaning ops ──────────────────────────────────────────────────────
  const handleRemoveDups = async () => {
    setLoading(true);
    try {
      const res = await removeDuplicates();
      onDataUpdate(
        { ...info, rows: res.data.rows },
        res.data.preview
      );
      setFilteredPreview(null);
      showMsg("success", `Removed ${res.data.removed} duplicate rows.`);
    } catch (e) {
      showMsg("error", e.response?.data?.detail || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDropNulls = async () => {
    setLoading(true);
    try {
      const res = await dropNulls();
      onDataUpdate({ ...info, rows: res.data.rows }, res.data.preview);
      setFilteredPreview(null);
      showMsg("success", `Dropped ${res.data.removed} rows with nulls.`);
    } catch (e) {
      showMsg("error", e.response?.data?.detail || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillNulls = async () => {
    setLoading(true);
    try {
      const payload = {
        strategy: fillStrategy,
        custom_value: fillStrategy === "custom" ? fillCustom : null,
      };
      const res = await fillNulls(payload);
      onDataUpdate({ ...info, rows: res.data.rows }, res.data.preview);
      setFilteredPreview(null);
      showMsg("success", "Null values filled.");
    } catch (e) {
      showMsg("error", e.response?.data?.detail || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDropColumn = async () => {
    if (!dropCol) return;
    setLoading(true);
    try {
      const res = await dropColumn(dropCol);
      onDataUpdate(res.data.info, res.data.preview);
      setDropCol("");
      setFilteredPreview(null);
      showMsg("success", `Column "${dropCol}" dropped.`);
    } catch (e) {
      showMsg("error", e.response?.data?.detail || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Export ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setLoading(true);
    try {
      const payload = {
        filters: filters.map(({ column, operator, value }) => ({
          column,
          operator,
          value,
        })),
        sort_column: sortColumn || null,
        sort_ascending: sortAscending,
        visible_columns: visibleColumns,
      };
      const res = await exportCsv(payload);
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "filtered_data.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showMsg("error", "Export failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle column visibility ──────────────────────────────────────────
  const toggleCol = (col) => {
    const current = visibleColumns || allColNames;
    if (current.includes(col)) {
      if (current.length === 1) return; // keep at least one
      setVisibleColumns(current.filter((c) => c !== col));
    } else {
      setVisibleColumns([...current, col]);
    }
  };

  const displayPreview = filteredPreview || preview;
  const displayInfo = filteredPreview
    ? { ...info, rows: totalRows }
    : info;

  return (
    <div>
      <div className="section-title">Filter & Clean</div>

      {msg && (
        <div className={`msg msg-${msg.type}`}>{msg.text}</div>
      )}
      {loading && <div className="loading">Processing…</div>}

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Filters (AND logic)</div>

        {filters.map((f) => (
          <div className="filter-row" key={f.id}>
            <select
              value={f.column}
              onChange={(e) => updateFilter(f.id, "column", e.target.value)}
              style={{ minWidth: 130 }}
            >
              {allColNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={f.operator}
              onChange={(e) => updateFilter(f.id, "operator", e.target.value)}
              style={{ minWidth: 160 }}
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>

            {!NO_VALUE_OPS.includes(f.operator) && (
              <input
                type="text"
                placeholder="value"
                value={f.value}
                onChange={(e) => updateFilter(f.id, "value", e.target.value)}
                style={{ minWidth: 120 }}
              />
            )}

            <button
              className="btn btn-sm btn-danger"
              onClick={() => removeFilter(f.id)}
            >
              Remove
            </button>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="btn btn-sm" onClick={addFilter}>+ Add filter</button>
          <button className="btn btn-sm btn-primary" onClick={applyFilters} disabled={loading}>
            Apply
          </button>
          <button className="btn btn-sm" onClick={resetFilters}>Reset</button>
        </div>
      </div>

      {/* ── Sort ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Sort</div>
        <div className="field-row">
          <div className="field">
            <label>Column</label>
            <select
              value={sortColumn}
              onChange={(e) => setSortColumn(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="">— none —</option>
              {allColNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Direction</label>
            <select
              value={sortAscending ? "asc" : "desc"}
              onChange={(e) => setSortAscending(e.target.value === "asc")}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <button className="btn btn-sm btn-primary" onClick={applyFilters} disabled={loading}>
            Apply Sort
          </button>
        </div>
      </div>

      {/* ── Column visibility ────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Column Visibility</div>
        <div className="col-toggle-grid">
          {allColNames.map((col) => (
            <label key={col} className="col-toggle">
              <input
                type="checkbox"
                checked={shown.includes(col)}
                onChange={() => toggleCol(col)}
              />
              {col}
            </label>
          ))}
        </div>
        <button
          className="btn btn-sm btn-primary"
          style={{ marginTop: 10 }}
          onClick={applyFilters}
          disabled={loading}
        >
          Apply Visibility
        </button>
      </div>

      {/* ── Drop column (permanent) ──────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Drop Column (permanent)</div>
        <div className="field-row">
          <select
            value={dropCol}
            onChange={(e) => setDropCol(e.target.value)}
            style={{ minWidth: 180 }}
          >
            <option value="">— select column —</option>
            {allColNames.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            className="btn btn-sm btn-danger"
            onClick={handleDropColumn}
            disabled={!dropCol || loading}
          >
            Drop Column
          </button>
        </div>
      </div>

      {/* ── Data Cleaning ────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Data Cleaning</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <button className="btn btn-sm" onClick={handleRemoveDups} disabled={loading}>
            Remove Duplicate Rows
          </button>
          <button className="btn btn-sm" onClick={handleDropNulls} disabled={loading}>
            Drop Rows with Nulls
          </button>
        </div>

        <hr />

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
            Fill null values:
          </div>
          <div className="field-row">
            <select
              value={fillStrategy}
              onChange={(e) => setFillStrategy(e.target.value)}
            >
              <option value="mean">Mean (numeric)</option>
              <option value="median">Median (numeric)</option>
              <option value="mode">Mode (all)</option>
              <option value="custom">Custom value</option>
            </select>

            {fillStrategy === "custom" && (
              <input
                type="text"
                placeholder="replacement value"
                value={fillCustom}
                onChange={(e) => setFillCustom(e.target.value)}
                style={{ width: 160 }}
              />
            )}

            <button
              className="btn btn-sm btn-primary"
              onClick={handleFillNulls}
              disabled={loading}
            >
              Fill Nulls
            </button>
          </div>
        </div>
      </div>

      {/* ── Export ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <button className="btn" onClick={handleExport} disabled={loading}>
          ↓ Export Filtered CSV
        </button>
      </div>

      {/* ── Filtered preview ─────────────────────────────────────────── */}
      <DataTable
        info={displayInfo}
        preview={displayPreview}
        onDataUpdate={onDataUpdate}
      />
    </div>
  );
}
