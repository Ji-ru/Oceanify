// src/contexts/AlertContext.jsx
import { createClient } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useState } from 'react';
import API from '../api';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AlertContext = createContext();

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  /**
   * Load alerts from API with caching
   * @param {boolean} forceRefresh - Force fetch even if cache is valid
   */
  const loadAlerts = useCallback(async (forceRefresh = false) => {
    // Check if cache is still valid
    const now = Date.now();
    const cacheIsValid = lastFetched && (now - lastFetched) < CACHE_DURATION;
    
    if (!forceRefresh && cacheIsValid && alerts.length > 0) {
      console.log('✅ Using cached alerts data');
      return;
    }

    setLoading(true);
    console.log('🔄 Fetching alerts from API...');

    try {
      console.log('🔄 Fetching alerts from API...');
      const response = await API.get('/alerts');
      console.log('✅ API Response received:', response);
      console.log('✅ Response data:', response.data);
      console.log('✅ Data type:', typeof response.data, Array.isArray(response.data) ? 'is array' : 'not array');

      // Validate response data
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.log('❌ API returned HTML instead of JSON, trying Supabase fallback');
        throw new Error('API returned HTML');
      }

      setAlerts(Array.isArray(response.data) ? response.data : []);
      setLastFetched(Date.now());
      console.log('✅ Alerts set successfully');
    } catch (error) {
      console.error("Failed to fetch alerts from Laravel:", error);
      
      // Fallback to Supabase
      try {
        const { data: supabaseData, error: supabaseError } = await supabase
          .from("alerts")
          .select("*")
          .order("time", { ascending: false });
        
        if (supabaseError) throw supabaseError;
        if (supabaseData) {
          setAlerts(supabaseData);
          setLastFetched(Date.now());
          console.log('✅ Alerts fetched from Supabase fallback');
        }
      } catch (supabaseError) {
        console.error("Error fetching from Supabase:", supabaseError);
      }
    } finally {
      setLoading(false);
    }
  }, [lastFetched, alerts.length]);

  /**
   * Create a new alert
   */
  const createAlert = useCallback(async (alertData) => {
    try {
      const response = await API.post('/alerts', alertData);
      
      if (response.status === 201 || response.status === 200) {
        // Make sure we have the complete data with proper formatting
        const newAlert = Array.isArray(response.data) ? response.data[0] : response.data;
        
        if (newAlert && newAlert.id) {
          // Update cache immediately with new alert
          setAlerts(prev => [newAlert, ...prev]);
          setLastFetched(Date.now());
          return { success: true, data: newAlert };
        }
      }
    } catch (error) {
      console.error("Error creating alert via Laravel:", error);
      
      // Fallback to Supabase
      try {
        const { data: supabaseData, error: supabaseError } = await supabase
          .from("alerts")
          .insert([alertData])
          .select()
          .single(); // Use .single() to get object instead of array
        
        if (!supabaseError && supabaseData) {
          setAlerts(prev => [supabaseData, ...prev]);
          setLastFetched(Date.now());
          return { success: true, data: supabaseData };
        }
        throw supabaseError;
      } catch (supabaseError) {
        return { success: false, error: supabaseError.message };
      }
    }
    
    return { success: false, error: 'Unknown error occurred' };
  }, []);

  /**
   * Update an existing alert
   */
  const updateAlert = useCallback(async (id, alertData) => {
    try {
      const response = await API.put(`/alerts/${id}`, alertData);
      
      if (response.status >= 200 && response.status < 300) {
        // Get the updated alert from response
        const updatedAlert = Array.isArray(response.data) ? response.data[0] : response.data;
        
        // Update cache with the complete updated alert
        setAlerts(prev => 
          prev.map(alert => alert.id === id ? { ...alert, ...updatedAlert } : alert)
        );
        setLastFetched(Date.now());
        return { success: true, data: updatedAlert };
      }
    } catch (error) {
      console.error("Error updating alert via Laravel:", error);
      
      // Fallback to Supabase
      try {
        const { data: updatedData, error: supabaseError } = await supabase
          .from("alerts")
          .update(alertData)
          .eq("id", id)
          .select()
          .single(); // Get the updated record back
        
        if (!supabaseError && updatedData) {
          setAlerts(prev => 
            prev.map(alert => alert.id === id ? { ...alert, ...updatedData } : alert)
          );
          setLastFetched(Date.now());
          return { success: true, data: updatedData };
        }
        throw supabaseError;
      } catch (supabaseError) {
        return { success: false, error: supabaseError.message };
      }
    }
    
    return { success: false, error: 'Unknown error occurred' };
  }, []);

  /**
   * Delete an alert
   */
  const deleteAlert = useCallback(async (id) => {
    try {
      await API.delete(`/alerts/${id}`);
      
      // Update cache immediately by removing the alert
      setAlerts(prev => prev.filter(alert => alert.id !== id));
      setLastFetched(Date.now());
      return { success: true };
    } catch (error) {
      console.error("Error deleting alert via Laravel:", error);
      
      // Fallback to Supabase
      try {
        const { error: supabaseError } = await supabase
          .from("alerts")
          .delete()
          .eq("id", id);
        
        if (!supabaseError) {
          setAlerts(prev => prev.filter(alert => alert.id !== id));
          setLastFetched(Date.now());
          return { success: true };
        }
        throw supabaseError;
      } catch (supabaseError) {
        return { success: false, error: supabaseError.message };
      }
    }
    
    return { success: false, error: 'Unknown error occurred' };
  }, []);

  /**
   * Manually invalidate cache and force refresh
   */
  const refreshAlerts = useCallback(() => {
    return loadAlerts(true);
  }, [loadAlerts]);

  const value = {
    alerts,
    loading,
    loadAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    refreshAlerts,
    lastFetched,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};