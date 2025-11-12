import { useState, useEffect, useCallback, useRef } from "react";
import {
  analyzeLocation,
  analyzeMultipleLocations,
  getAlertSummary,
} from "../services/weatherAlertService";
import portsData from "../data/ports.json";

/**
 * Custom hook for managing automated weather alerts
 * @param {Object} options Configuration options
 * @param {number} options.updateInterval Update interval in milliseconds (default: 30 minutes)
 * @param {boolean} options.monitorPorts Whether to monitor all ports (default: true)
 * @param {boolean} options.monitorUserLocation Whether to monitor user's GPS location (default: true)
 */
export const useWeatherAlerts = (options = {}) => {
  const {
    updateInterval = 30 * 60 * 1000, // 30 minutes default
    monitorPorts = true,
    monitorUserLocation = true,
  } = options;

  const [userLocationAlert, setUserLocationAlert] = useState(null);
  const [portAlerts, setPortAlerts] = useState([]);
  const [alertSummary, setAlertSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Get user's GPS location
   */
  const getUserLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  /**
   * Fetch alerts for user's current location
   */
  const fetchUserLocationAlert = useCallback(async () => {
    if (!monitorUserLocation) return null;

    try {
      const location = await getUserLocation();
      setUserLocation(location);

      const alert = await analyzeLocation(
        location.lat,
        location.lng,
        "Your Location"
      );

      return alert;
    } catch (error) {
      console.error("Failed to fetch user location alert:", error);
      setError("Unable to access location. Please enable location services.");
      return null;
    }
  }, [monitorUserLocation, getUserLocation]);

  /**
   * Fetch alerts for all monitored ports
   */
  const fetchPortAlerts = useCallback(async () => {
    if (!monitorPorts) return [];

    try {
      const ports = portsData.ports_of_mindanao;
      const alerts = await analyzeMultipleLocations(ports);
      return alerts;
    } catch (error) {
      console.error("Failed to fetch port alerts:", error);
      return [];
    }
  }, [monitorPorts]);

  /**
   * Fetch all alerts (user location + ports)
   */
  const fetchAllAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [userAlert, ports] = await Promise.all([
        fetchUserLocationAlert(),
        fetchPortAlerts(),
      ]);

      if (!isMountedRef.current) return;

      if (userAlert) {
        setUserLocationAlert(userAlert);
      }

      if (ports.length > 0) {
        setPortAlerts(ports);

        // Calculate summary
        const allAlerts = userAlert ? [userAlert, ...ports] : ports;
        const summary = getAlertSummary(allAlerts);
        setAlertSummary(summary);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      setError("Failed to fetch weather alerts. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchUserLocationAlert, fetchPortAlerts]);

  /**
   * Manual refresh function
   */
  const refreshAlerts = useCallback(() => {
    fetchAllAlerts();
  }, [fetchAllAlerts]);

  /**
   * Initialize and set up auto-refresh
   */
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchAllAlerts();

    // Set up interval for auto-refresh
    if (updateInterval > 0) {
      intervalRef.current = setInterval(() => {
        console.log("Auto-refreshing weather alerts...");
        fetchAllAlerts();
      }, updateInterval);
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllAlerts, updateInterval]);

  /**
   * Get alerts by severity level
   */
  const getAlertsBySeverity = useCallback(
    (severity) => {
      const allAlerts = userLocationAlert
        ? [userLocationAlert, ...portAlerts]
        : portAlerts;

      return allAlerts.filter((alert) => alert.overallSeverity === severity);
    },
    [userLocationAlert, portAlerts]
  );

  /**
   * Get alert for specific location
   */
  const getAlertForLocation = useCallback(
    (locationName) => {
      if (userLocationAlert?.location === locationName) {
        return userLocationAlert;
      }
      return portAlerts.find((alert) => alert.location === locationName);
    },
    [userLocationAlert, portAlerts]
  );

  return {
    // Alert data
    userLocationAlert,
    portAlerts,
    alertSummary,

    // User location
    userLocation,

    // State
    loading,
    error,
    lastUpdate,

    // Actions
    getUserLocation,
    refreshAlerts,
    getAlertsBySeverity,
    getAlertForLocation,

    // Config
    updateInterval,
  };
};
