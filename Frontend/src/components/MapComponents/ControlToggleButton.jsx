import React from "react";
import { Layers, Bell, X } from "lucide-react";

const ControlToggleButton = ({
  showControlsPanel,
  showAlertsPanel,
  showWeatherNotification,
  toggleControlsPanel,
  toggleAlertsPanel,
  toggleWeatherNotification,
  alertsCount,
}) => {
  return (
    <div className="fixed flex flex-col gap-4 bottom-4 right-4 sm:top-24 sm:right-4 z-1000">
      {/* Layers Toggle */}
      <button
        onClick={toggleControlsPanel}
        className={`p-3 sm:p-4 bg-[#1e1e1e] rounded-full border-1 border-neutral-600 hover:bg-[#272727] transition-all duration-200 ${
          showControlsPanel ? "bg-[#272727]" : ""
        }`}
      >
        {showControlsPanel ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        ) : (
          <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        )}
      </button>

      {/* Weather Notification Toggle */}
      <button
        onClick={toggleWeatherNotification}
        className={`p-10 sm:p-4 bg-[#1e1e1e] rounded-full border-1 border-neutral-600 hover:bg-[#272727] transition-all duration-200 ${
          showWeatherNotification ? "bg-[#272727]" : ""
        }`}
      >
        <div className="relative">
          {showWeatherNotification ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          ) : (
            <>
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              {alertsCount > 0 && (
                <div className="absolute flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full -top-1 -right-1">
                  <span className="text-xs font-bold text-white">
                    {alertsCount}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default ControlToggleButton;