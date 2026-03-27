import React, { useState } from "react";
import Navbar from "./components/Navbar";
import FileUpload from "./components/FileUpload";
import DataTable from "./components/DataTable";
import FilterPanel from "./components/FilterPanel";
import VisualizationPanel from "./components/VisualizationPanel";
import StatsPanel from "./components/StatsPanel";
import "./App.css";

export default function App() {
  const [section, setSection] = useState("upload");

  // Dataset metadata returned by backend after upload / cleaning ops
  const [dataInfo, setDataInfo] = useState(null);  // { rows, cols, columns, filename }
  const [preview, setPreview] = useState([]);       // array of row objects

  // Active filters + sort kept here so FilterPanel and VisualizationPanel share them
  const [filters, setFilters] = useState([]);
  const [sortColumn, setSortColumn] = useState("");
  const [sortAscending, setSortAscending] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(null); // null = all

  // Called after upload or any op that changes the dataset
  const handleDataUpdate = (info, rows) => {
    setDataInfo(info);
    setPreview(rows);
    // Reset filters/sort when dataset changes
    setFilters([]);
    setSortColumn("");
    setSortAscending(true);
    setVisibleColumns(null);
  };

  return (
    <div className="app">
      <Navbar section={section} setSection={setSection} hasData={!!dataInfo} />

      <main className="main">
        {section === "upload" && (
          <FileUpload onUpload={handleDataUpdate} />
        )}

        {section === "preview" && (
          <DataTable
            info={dataInfo}
            preview={preview}
            onDataUpdate={handleDataUpdate}
          />
        )}

        {section === "filter" && (
          <FilterPanel
            info={dataInfo}
            preview={preview}
            setPreview={setPreview}
            filters={filters}
            setFilters={setFilters}
            sortColumn={sortColumn}
            setSortColumn={setSortColumn}
            sortAscending={sortAscending}
            setSortAscending={setSortAscending}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            onDataUpdate={handleDataUpdate}
          />
        )}

        {section === "visualize" && (
          <VisualizationPanel
            info={dataInfo}
            filters={filters}
          />
        )}

        {section === "stats" && (
          <StatsPanel info={dataInfo} />
        )}
      </main>
    </div>
  );
}
