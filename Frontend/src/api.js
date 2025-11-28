import axios from "axios";
import supabase from "./supabaseClient";

// Prefer environment variable; fallback to localhost for development
// For production, VITE_API_BASE_URL must be set to deployed backend URL
const baseURL = (import.meta?.env?.VITE_API_BASE_URL || "").trim() || 'http://localhost:8000/api';

const API = axios.create({
  baseURL,
});

console.log("VITE_API_BASE_URL env:", import.meta.env.VITE_API_BASE_URL);
console.log("Final API baseURL:", baseURL);

// ✅ Add request interceptor to include user info in headers
API.interceptors.request.use(
  async (config) => {
    try {
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('🔍 API.js Session check:', session); // Debug log
      
      if (session?.user) {
        // Add user info to headers
        config.headers['X-User-Id'] = session.user.id;
        config.headers['X-User-Email'] = session.user.email;
        console.log('✅ API.js User headers added:', {
          userId: session.user.id,
          userEmail: session.user.email
        });
      } else {
        console.log('⚠️ API.js No session found');
      }
    } catch (error) {
      console.error('❌ API.js Error getting session:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;