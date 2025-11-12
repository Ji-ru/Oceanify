import { useState, useEffect } from 'react';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        console.log("🔄 Fetching alerts from Laravel...");
        
        const response = await fetch("http://localhost:8000/api/alerts", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        console.log("📡 Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Alerts fetched successfully:", data);
          setAlerts(Array.isArray(data) ? data : []);
          setError(null);
        } else {
          // Log response text for debugging
          const errorText = await response.text();
          console.error("❌ Failed to fetch alerts:", response.status, errorText);
          
          // Don't clear alerts, keep showing old data
          setError(`Server error: ${response.status}`);
        }
      } catch (error) {
        console.error("❌ Error fetching alerts:", error);
        
        // Check if it's a network error
        if (error.message.includes('Failed to fetch')) {
          console.warn("⚠️ Laravel backend not running? Continuing with empty alerts...");
          setError("Backend not available");
        } else {
          setError(error.message);
        }
        
        // Keep old alerts if any, otherwise use empty array
        if (alerts.length === 0) {
          setAlerts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchAlerts();
    
    // Fetch every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  return { alerts, loading, error };
};