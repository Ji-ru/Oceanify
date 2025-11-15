import React, { useState } from "react";
import { getWeatherIcon } from "../../utils/weatherUtils";
import { DAYS_OF_WEEK } from "../../utils/constants";
import { ChevronUp, ChevronDown } from "lucide-react";

const ForecastPanel = ({
  visible,
  onClose,
  forecastData,
  currentLocation,
  selectedLocation,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!visible) return null;
  if (!forecastData?.daily) return null;

  const { daily } = forecastData;
  const displayLocation = selectedLocation || currentLocation;

  const getLocationName = () =>
    selectedLocation ? "Selected Location" : "Your Location";

  const toggleMinimize = () => setIsMinimized(!isMinimized);

  // ✅ Consistent width container for both states
  const PanelContainer = ({ children }) => (
    <div
      className="
      fixed z-50 bottom-4 
      left-2 right-2          /* ✅ full width on mobile */
      sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 /* ✅ center on tablet+ */
      md:w-auto md:max-w-max  /* ✅ don't force width */
    "
    >
      {children}
    </div>
  );

  // ✅ Minimized View
  if (isMinimized) {
    return (
      <PanelContainer>
        <div className="bg-[#1e1e1e] border border-neutral-600 rounded-2xl shadow-lg">
          <div className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <h3 className="text-sm font-semibold text-white">
                  7-DAY FORECAST - {getLocationName()}
                </h3>
                {displayLocation && (
                  <div className="text-xs text-gray-400 truncate">
                    {displayLocation.lat.toFixed(2)}°N,{" "}
                    {displayLocation.lng.toFixed(2)}°E
                  </div>
                )}
              </div>

              <button
                onClick={toggleMinimize}
                className="flex items-center justify-center w-6 h-6 transition-all duration-200 border rounded bg-[#272727] hover:bg-[#373737] border-[#373737]"
                title="Expand forecast"
              >
                <ChevronDown className="w-3 h-3 text-white" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {getWeatherIcon(daily.weather_code[0], true)}
                </div>
                <div>
                  <div className="text-xs text-gray-400">Today</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-lg font-bold text-white">
                      {Math.round(daily.temperature_2m_max[0])}°
                    </div>
                    <div className="text-sm text-gray-400">
                      {Math.round(daily.temperature_2m_min[0])}°
                    </div>
                  </div>
                </div>
              </div>

              {daily.precipitation_probability_max?.[0] > 20 && (
                <div className="flex items-center gap-1 px-2 py-1 text-xs rounded text-white bg-[#272727]">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {daily.precipitation_probability_max[0]}%
                </div>
              )}
            </div>
          </div>
        </div>
      </PanelContainer>
    );
  }

  // ✅ Expanded View
  return (
    <PanelContainer>
      <div className="bg-[#1e1e1e] border border-neutral-600 rounded-2xl shadow-lg">
        <div className="p-3 sm:p-4"> {/* Responsive padding */}
          <div className="relative flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between sm:mb-4 sm:gap-3"> {/* Responsive spacing and layout */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <h3 className="text-xs sm:text-sm font-semibold text-white truncate"> {/* Responsive text size */}
                7-DAY FORECAST - {getLocationName()}
              </h3>
              <br />
              {displayLocation && (
                <div className="text-xs text-gray-400 truncate">
                  {displayLocation.lat.toFixed(2)}°N,{" "}
                  {displayLocation.lng.toFixed(2)}°E
                </div>
              )}
            </div>

            <button
              onClick={toggleMinimize}
              className="flex items-center justify-center w-6 h-6 transition-all duration-200 border rounded bg-[#272727] hover:bg-[#373737] border-[#373737] self-end sm:self-auto" /* Responsive button alignment */
              title="Minimize forecast"
            >
              <ChevronUp className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* Responsive scrollable forecast days with adaptive sizing */}
          <div className="flex gap-1 sm:gap-2 pb-2 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0f0f0f]">
            {daily.time.slice(0, 7).map((date, index) => {
              const dayName =
                index === 0 ? "TODAY" : DAYS_OF_WEEK[new Date(date).getDay()];
              const weatherIcon = getWeatherIcon(
                daily.weather_code[index],
                true
              );
              const maxTemp = Math.round(daily.temperature_2m_max[index]);
              const minTemp = Math.round(daily.temperature_2m_min[index]);
              const precipitation =
                daily.precipitation_probability_max?.[index] || 0;

              return (
                <div
                  key={index}
                  className="flex-shrink-0 p-2 transition-all duration-200 bg-[#272727] rounded-lg hover:bg-[#323232] 
                  w-16 /* Mobile width */
                  sm:w-20 /* Small tablet width */
                  md:w-24 /* Desktop width */"
                >
                  <div className="space-y-1 sm:space-y-2 text-center"> {/* Responsive spacing */}
                    <div className="text-xs font-semibold text-white truncate">
                      {dayName}
                    </div>
                    <div className="text-xl sm:text-2xl"> {/* Responsive icon size */}
                      {weatherIcon}
                    </div>
                    {precipitation > 20 && (
                      <div className="flex items-center justify-center gap-1 px-1 py-1 text-xs rounded text-white bg-[#1e1e1e]">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1z" />
                        </svg>
                        {precipitation}%
                      </div>
                    )}
                    <div className="flex items-baseline justify-center gap-1 sm:gap-2"> {/* Responsive gap */}
                      <div className="text-sm sm:text-lg font-bold text-white"> {/* Responsive text size */}
                        {maxTemp}°
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400"> {/* Responsive text size */}
                        {minTemp}°
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scroll bar indicator - visible only on mobile */}
          <div className="flex justify-center mt-2 sm:hidden">
            <div className="w-16 h-1 rounded-full bg-[#272727]" />
          </div>
        </div>
      </div>
    </PanelContainer>
  );
};

export default ForecastPanel;
