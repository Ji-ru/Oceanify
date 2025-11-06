import React from "react";
import { getWeatherIcon } from "../../utils/weatherUtils";
import { DAYS_OF_WEEK } from "../../utils/constants";

const ForecastPanel = ({
  visible,
  onClose,
  forecastData,
  currentLocation,
  selectedLocation,
}) => {
  if (!visible) return null;
  if (!forecastData?.daily) return null;
  const { daily } = forecastData;
  const displayLocation = selectedLocation || currentLocation;

  const getLocationName = () => {
    if (selectedLocation) {
      return "Selected Location";
    }
    return "Your Location";
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="border shadow-2xl bg-gradient-to-br from-white/10 to-white/5 border-white/20 rounded-2xl backdrop-blur-2xl pointer-events-auto">
        <div className="p-4">
          {/* Header */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">
                7-DAY FORECAST - {getLocationName()}
              </h3>
              {displayLocation && (
                <div className="text-xs text-white/60">
                  {displayLocation.lat.toFixed(2)}°N,{" "}
                  {displayLocation.lng.toFixed(2)}°E
                </div>
              )}
            </div>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-0 flex items-center justify-center w-6 h-6 transition-all duration-200 border rounded-full bg-white/10 hover:bg-white/20 border-white/20"
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

          {/* Horizontal Forecast Items */}
          <div className="flex justify-center gap-2 pb-2 overflow-x-auto scrollbar-hide">
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
                  className="flex-shrink-0 w-20 p-3 transition-all duration-300 border shadow-lg bg-gradient-to-br from-white/15 to-white/5 border-white/20 rounded-xl backdrop-blur-sm hover:from-white/20 hover:to-white/10 hover:border-white/30"
                >
                  <div className="space-y-2 text-center">
                    {/* Day */}
                    <div className="text-xs font-semibold tracking-wide text-white">
                      {dayName}
                    </div>

                    {/* Weather Icon */}
                    <div className="text-2xl filter drop-shadow-lg">
                      {weatherIcon}
                    </div>

                    {/* Precipitation */}
                    {precipitation > 20 && (
                      <div className="flex items-center justify-center gap-1 px-2 py-1 text-xs rounded-full text-white/80 bg-white/10">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                        </svg>
                        {precipitation}%
                      </div>
                    )}

                    {/* Temperatures */}
                    <div className="flex items-baseline justify-center gap-2">
                      <div className="text-lg font-bold text-white drop-shadow-sm">
                        {maxTemp}°
                      </div>
                      <div className="text-sm text-white/60">{minTemp}°</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hidden Scroll Indicator */}
          <div className="flex justify-center mt-2">
            <div className="w-20 h-1 rounded-full bg-white/20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastPanel;
