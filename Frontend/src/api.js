import axios from "axios";
import supabase from "./supabaseClient";


const baseURL = (import.meta?.env?.VITE_API_BASE_URL || "").trim() || `${window.location.origin}/api`;

const API = axios.create({
  baseURL,
});

console.log("Base URL:", import.meta.env.VITE_API_BASE_URL);


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
        console.log('API.js No session found');
      }
    } catch (error) {
      console.error('API.js Error getting session:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;