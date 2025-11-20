import axios from "axios";

// ⭐ Use ONLY your Render backend URL
export default axios.create({
  baseURL: "https://toolbeltai-mitigation-backend.onrender.com",
});

// Optional export if needed elsewhere
export const API_BASE = "https://toolbeltai-mitigation-backend.onrender.com";
