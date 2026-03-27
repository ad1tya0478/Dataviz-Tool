import React from "react";

const SECTIONS = [
  { id: "upload", label: "Upload" },
  { id: "preview", label: "Preview" },
  { id: "filter", label: "Filter & Clean" },
  { id: "visualize", label: "Visualize" },
  { id: "stats", label: "Statistics" },
];

export default function Navbar({ section, setSection, hasData }) {
  return (
    <nav className="navbar">
      <span className="navbar-brand">DataViz</span>
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          className={`nav-btn${section === s.id ? " active" : ""}`}
          onClick={() => setSection(s.id)}
          // Prevent navigating to data sections before upload
          disabled={s.id !== "upload" && !hasData}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
