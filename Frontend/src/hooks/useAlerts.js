import { useState, useEffect } from 'react';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);

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
          setAlerts(data);
        } else {
          console.error("❌ Failed to fetch alerts:", response.status);
          setAlerts([]);
        }
      } catch (error) {
        console.error("❌ Error fetching alerts:", error);
        setAlerts([]);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, []);

  return { alerts };
};