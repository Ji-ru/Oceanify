import React from 'react';

const ControlToggleButton = ({
  showControlsPanel,
  showAlertsPanel,
  toggleControlsPanel,
  toggleAlertsPanel,
  alertsCount
}) => {
  return (
    <div className="fixed flex flex-col gap-3 top-24 right-4 z-1000">
      {/* Layers Toggle */}
      <button
        onClick={toggleControlsPanel}
        className={`p-4 bg-gradient-to-br from-white/10 to-white/5 border rounded-2xl backdrop-blur-2xl shadow-2xl hover:scale-105 transition-all duration-300 ${
          showControlsPanel ? "border-white/30 bg-white/20" : "border-white/20"
        }`}
      >
        <div className="relative w-6 h-6">
          <div
            className={`absolute left-0 w-6 h-0.5 bg-white transition-all duration-300 ${
              showControlsPanel ? "rotate-45 top-3" : "top-1"
            }`}
          ></div>
          <div
            className={`absolute left-0 w-6 h-0.5 bg-white transition-all duration-300 ${
              showControlsPanel ? "opacity-0" : "opacity-100 top-3"
            }`}
          ></div>
          <div
            className={`absolute left-0 w-6 h-0.5 bg-white transition-all duration-300 ${
              showControlsPanel ? "-rotate-45 top-3" : "top-5"
            }`}
          ></div>
        </div>
      </button>

      {/* Alerts Toggle */}
      <button
        onClick={toggleAlertsPanel}
        className={`p-4 bg-gradient-to-br from-red-500/20 to-orange-500/10 border rounded-2xl backdrop-blur-2xl shadow-2xl hover:scale-105 transition-all duration-300 ${
          showAlertsPanel
            ? "border-red-400/50 bg-red-500/30"
            : "border-red-500/30"
        }`}
      >
        <div className="relative flex items-center justify-center w-6 h-6">
          <div className="text-lg text-white">⚠️</div>
          {alertsCount > 0 && (
            <div className="absolute flex items-center justify-center w-5 h-5 bg-red-500 rounded-full -top-1 -right-1">
              <span className="text-xs font-bold text-white">
                {alertsCount}
              </span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

export default ControlToggleButton;