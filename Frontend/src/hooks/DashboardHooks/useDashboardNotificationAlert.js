// hooks/DashboardHooks/useDashboardNotificationAlert.js
import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing notification alert state and operations
 * Provides centralized state management for alert filtering, marking as read, and statistics
 * 
 * @param {Array} initialAlerts - Initial array of alert objects
 * @returns {Object} Alert management functions and state
 */
export const useDashboardNotificationAlert = (initialAlerts = []) => {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [readAlerts, setReadAlerts] = useState(new Set());

  // Mark single alert as read
  const markAsRead = useCallback((alertId) => {
    setReadAlerts(prev => new Set([...prev, alertId]));
  }, []);

  // Mark all alerts as read
  const markAllAsRead = useCallback(() => {
    const allIds = alerts.map(alert => alert.id);
    setReadAlerts(new Set(allIds));
  }, [alerts]);

  // Add new alerts
  const addAlerts = useCallback((newAlerts) => {
    setAlerts(prev => [...newAlerts, ...prev]);
  }, []);

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setReadAlerts(new Set());
  }, []);

  // Filter alerts by status
  const getFilteredAlerts = useCallback((filter = 'all') => {
    switch (filter) {
      case 'unread':
        return alerts.filter(alert => !readAlerts.has(alert.id));
      case 'read':
        return alerts.filter(alert => readAlerts.has(alert.id));
      default:
        return alerts;
    }
  }, [alerts, readAlerts]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: alerts.length,
    unread: alerts.filter(alert => !readAlerts.has(alert.id)).length,
    highPriority: alerts.filter(alert => 
      alert.priority === 'high' || alert.severity === 'danger'
    ).length,
  }), [alerts, readAlerts]);

  return {
    alerts,
    readAlerts,
    stats,
    markAsRead,
    markAllAsRead,
    addAlerts,
    clearAlerts,
    getFilteredAlerts,
  };
};