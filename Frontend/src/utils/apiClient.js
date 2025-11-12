import axios from 'axios';
import supabase from '../supabaseClient';

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include user info in headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('🔍 Session check:', session); // Debug log
      
      if (session?.user) {
        // Add user info to headers
        config.headers['X-User-Id'] = session.user.id;
        config.headers['X-User-Email'] = session.user.email;
        console.log('✅ User headers added:', {
          userId: session.user.id,
          userEmail: session.user.email
        });
      } else {
        console.log('⚠️ No session found');
      }
    } catch (error) {
      console.error('❌ Error getting session:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;