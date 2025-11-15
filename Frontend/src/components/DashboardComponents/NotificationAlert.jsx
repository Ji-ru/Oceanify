// components/NotificationAlert.jsx
import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";

/**
 * NotificationAlert Component
 *
 * A collapsible component that displays admin alerts and notifications with:
 * - Compact header view showing alert count
 * - Expandable detailed view with alert listings
 * - Simple display of message and timestamp only
 *
 * @param {Object} props
 * @param {Array} props.adminAlerts - Array of alert objects
 * @param {boolean} props.autoRefresh - Whether to auto-refresh alerts (for future use)
 */
const NotificationAlert = ({ adminAlerts = [], autoRefresh = true }) => {
  const [expanded, setExpanded] = useState(false);

  // Calculate alert statistics
  const alertStats = useMemo(() => {
    const total = adminAlerts.length;
    const highPriority = adminAlerts.filter(
      (alert) => alert.priority === "high" || alert.severity === "danger"
    ).length;

    return { total, highPriority };
  }, [adminAlerts]);

  // Determine overall severity for header display
  const overallSeverity = useMemo(() => {
    if (alertStats.highPriority > 0) return "high";
    if (alertStats.total > 0) return "medium";
    return "low";
  }, [alertStats]);

  // Severity configuration
  const severityConfig = {
    high: {
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500",
      label: "High Alert",
    },
    medium: {
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      borderColor: "border-amber-500",
      label: "Active",
    },
    low: {
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500",
      label: "Clear",
    },
  };

  const currentConfig = severityConfig[overallSeverity];

  // Render compact header
  const renderCompactHeader = () => (
    <div
      className="flex items-center justify-between p-4 transition-colors duration-200 cursor-pointer hover:bg-white/5"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center w-8 h-8 border-2 rounded-full ${currentConfig.bgColor} ${currentConfig.borderColor}`}
        >
          <Bell className={`w-4 h-4 ${currentConfig.color}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              Notification Alert
            </span>
            <span
              className={`px-2 py-1 text-xs font-bold rounded-full ${currentConfig.bgColor} ${currentConfig.color}`}
            >
              {currentConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{alertStats.total} total alerts</span>
            {alertStats.highPriority > 0 && (
              <span className="text-red-400">
                • {alertStats.highPriority} urgent
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {alertStats.total > 0 && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${currentConfig.bgColor}`}
          >
            <span className={`text-xs font-medium ${currentConfig.color}`}>
              {alertStats.total}
            </span>
          </div>
        )}
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </div>
  );

  // Render expanded content
  const renderExpandedContent = () => (
    <div className="border-t border-gray-700">
      {/* Alerts List */}
      <div className="overflow-y-auto max-h-80">
        {adminAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-400">
            <Bell className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No alerts found</p>
            <p className="mt-1 text-xs">
              Alerts will appear here when available
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {adminAlerts.map((alert) => {
              const isHighPriority =
                alert.priority === "high" || alert.severity === "danger";

              return (
                <div
                  key={alert.id}
                  className="p-4 transition-all duration-200 bg-white/5"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isHighPriority ? "bg-red-500/20" : "bg-amber-500/20"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-3 h-3 ${
                          isHighPriority ? "text-red-400" : "text-amber-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">
                          {alert.title || "System Alert"}
                        </p>
                        {isHighPriority && (
                          <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500/30 text-red-300 rounded">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-gray-300">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>
                      {new Date(alert.time || alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-[#1a1a1a]">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Last updated {new Date().toLocaleTimeString()}</span>
          <span>{adminAlerts.length} alerts</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden">
      {renderCompactHeader()}
      {expanded && renderExpandedContent()}
    </div>
  );
};

export default NotificationAlert;
