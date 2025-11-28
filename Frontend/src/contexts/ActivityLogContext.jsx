// src/contexts/ActivityLogContext.jsx
import { createClient } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useState } from 'react';
import API from '../api';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ActivityLogContext = createContext();

export const useActivityLogs = () => {
  const context = useContext(ActivityLogContext);
  if (!context) {
    throw new Error('useActivityLogs must be used within ActivityLogProvider');
  }
  return context;
};

export const ActivityLogProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  
  // Cache duration in milliseconds (3 minutes for logs since they update frequently)
  const CACHE_DURATION = 3 * 60 * 1000;

  /**
   * Load activity logs from API with caching
   * @param {boolean} forceRefresh - Force fetch even if cache is valid
   * @param {number} limit - Optional limit for number of logs to fetch
   */
  const loadLogs = useCallback(async (forceRefresh = false, limit = null) => {
    // Check if cache is still valid
    const now = Date.now();
    const cacheIsValid = lastFetched && (now - lastFetched) < CACHE_DURATION;
    
    if (!forceRefresh && cacheIsValid && logs.length > 0) {
      console.log('✅ Using cached activity logs');
      return;
    }

    setLoading(true);
    console.log('🔄 Fetching activity logs from API...');

    try {
      console.log('🔄 Fetching activity logs from API...');
      const params = limit ? { limit } : {};
      const response = await API.get('/activity-logs', { params });
      console.log('✅ API Response received:', response);
      console.log('✅ Response data:', response.data);
      console.log('✅ Data type:', typeof response.data, Array.isArray(response.data) ? 'is array' : 'not array');

      // Validate response data
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.log('❌ API returned HTML instead of JSON, trying Supabase fallback');
        throw new Error('API returned HTML');
      }

      setLogs(Array.isArray(response.data) ? response.data : []);
      setLastFetched(Date.now());
      console.log('✅ Activity logs set successfully');
    } catch (error) {
      console.error("Failed to fetch logs from Laravel:", error);
      
      // Fallback to Supabase
      try {
        let query = supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (limit) {
          query = query.limit(limit);
        }
        
        const { data: supabaseData, error: supabaseError } = await query;
        
        if (supabaseError) throw supabaseError;
        if (supabaseData) {
          setLogs(supabaseData);
          setLastFetched(Date.now());
          console.log('✅ Logs fetched from Supabase fallback');
        }
      } catch (supabaseError) {
        console.error("Error fetching from Supabase:", supabaseError);
      }
    } finally {
      setLoading(false);
    }
  }, [lastFetched, logs.length]);

  /**
   * Manually invalidate cache and force refresh
   */
  const refreshLogs = useCallback((limit = null) => {
    return loadLogs(true, limit);
  }, [loadLogs]);

  /**
   * Get logs filtered by action
   */
  const getLogsByAction = useCallback((action) => {
    return logs.filter(log => log.action.toLowerCase().includes(action.toLowerCase()));
  }, [logs]);

  /**
   * Get logs filtered by user
   */
  const getLogsByUser = useCallback((userId) => {
    return logs.filter(log => log.user_id === userId);
  }, [logs]);

  /**
   * Get recent logs (last N logs)
   */
  const getRecentLogs = useCallback((count = 10) => {
    return logs.slice(0, count);
  }, [logs]);

  const value = {
    logs,
    loading,
    loadLogs,
    refreshLogs,
    getLogsByAction,
    getLogsByUser,
    getRecentLogs,
    lastFetched,
  };

  return (
    <ActivityLogContext.Provider value={value}>
      {children}
    </ActivityLogContext.Provider>
  );
};