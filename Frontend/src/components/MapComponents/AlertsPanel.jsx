import React from "react";

const AlertsPanel = ({ visible, onClose, alerts }) => {
  if (!visible) return null;

  return (
    <div className="fixed z-50 duration-300 top-72 right-4 w-80 animate-in slide-in-from-right">
      <div className="border shadow-2xl bg-gradient-to-br from-red-900/90 to-orange-900/70 border-red-500/30 rounded-2xl backdrop-blur-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-400 rounded-full shadow-lg"></div>
              <h3 className="text-sm font-semibold tracking-wide text-white">
                MARINE ALERTS
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-6 h-6 transition-all duration-200 border rounded-full bg-white/10 hover:bg-white/20 border-white/20"
            >
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Alerts Content */}
          <div className="space-y-3 overflow-y-auto max-h-64">
            {alerts.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-2 text-4xl">🌊</div>
                <div className="mb-1 text-sm text-white/70">
                  No active alertsss
                </div>
                <div className="text-xs text-white/50">
                  Storm warnings and safety notices will appear here
                </div>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 border border-red-500/20 rounded-xl bg-gradient-to-br from-red-800/50 to-orange-800/30 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl">⚠️</div>
                    <div className="flex-1">
                      <div className="mb-1 text-sm font-semibold text-white">
                        {alert.title || "Alert"}
                      </div>
                      <div className="mb-2 text-sm text-white/90">
                        {alert.message}
                      </div>
                      <div className="text-xs text-red-200/80">
                        {new Date(alert.time).toLocaleString()} ({alert.type})
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
