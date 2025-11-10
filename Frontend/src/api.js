import axios from "axios";

// Prefer environment variable; fallback to same-origin "/api" when deployed behind a reverse proxy
// For Vite, define VITE_API_BASE_URL in your .env files
const baseURL = (import.meta?.env?.VITE_API_BASE_URL || "").trim() || `${window.location.origin}/api`;

const API = axios.create({
  baseURL,
});
console.log("Base URL:", import.meta.env.VITE_API_BASE_URL);

export default API;