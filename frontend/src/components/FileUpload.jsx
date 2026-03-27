import React, { useState, useRef } from "react";
import { uploadFile } from "../api/api";

export default function FileUpload({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef();

  const validate = (file) => {
    if (!file) return "No file selected.";
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx"))
      return "Only .csv and .xlsx files are supported.";
    return null;
  };

  const handle = async (file) => {
    const err = validate(file);
    if (err) { setError(err); setSuccess(""); return; }

    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await uploadFile(file);
      const { info, preview } = res.data;
      setSuccess(`Loaded "${info.filename}" — ${info.rows} rows × ${info.cols} columns.`);
      onUpload(info, preview);
    } catch (e) {
      setError(e.response?.data?.detail || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  // Drag events
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    handle(file);
  };
  const onChange = (e) => handle(e.target.files[0]);

  return (
    <div>
      <div className="section-title">Upload Dataset</div>

      {error && <div className="msg msg-error">{error}</div>}
      {success && <div className="msg msg-success">{success}</div>}
      {loading && <div className="loading">Uploading…</div>}

      <div
        className={`upload-area${dragging ? " drag-over" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
      >
        <div style={{ fontSize: 28 }}>↑</div>
        <strong style={{ fontSize: 13 }}>Drop file here or click to browse</strong>
        <p>Accepts .csv and .xlsx</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          style={{ display: "none" }}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
