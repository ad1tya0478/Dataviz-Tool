import axios from "axios";

const BASE = "http://localhost:8000/api";

// Upload a file (CSV or XLSX)
export const uploadFile = (file) => {
  const form = new FormData();
  form.append("file", file);
  return axios.post(`${BASE}/upload`, form);
};

// Apply filters + sort, get preview
export const filterData = (payload) => axios.post(`${BASE}/filter`, payload);

// Stats
export const getStats = () => axios.get(`${BASE}/stats`);

// Visualize
export const getChart = (payload) => axios.post(`${BASE}/visualize`, payload);

// Cleaning ops
export const removeDuplicates = () => axios.post(`${BASE}/remove-duplicates`);
export const dropNulls = () => axios.post(`${BASE}/drop-nulls`);
export const fillNulls = (payload) => axios.post(`${BASE}/fill-nulls`, payload);

// Permanently drop a column
export const dropColumn = (column) => axios.post(`${BASE}/drop-column`, { column });

// Export filtered CSV — returns a blob
export const exportCsv = (payload) =>
  axios.post(`${BASE}/export`, payload, { responseType: "blob" });
