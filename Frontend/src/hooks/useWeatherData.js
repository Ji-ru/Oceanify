import { useState } from "react";
import {
  fetchForecastData,
  fetchCurrentWeather,
  fetchWaveData,
} from "../utils/weatherApi";
import { getWeatherIcon, getWeatherDescription } from "../utils/weatherUtils";

export const useWeatherData = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);

  const fetchLocationData = async (lat, lng, dataType) => {
    setLoading(true);
    setLoadingType(dataType);

    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

    const cacheKey = `weather-cache-${lat}-${lng}-${dataType}`;
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    const cacheTime = localStorage.getItem(`${cacheKey}-time`);

    if (cached && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
      setLoading(false);
      setLoadingType(null);
      return cached;
    }

    try {
      // Always refresh forecast data for the location (separate from cache of current data)
      const forecast = await fetchForecastData(lat, lng);
      setForecastData(forecast);

      let result = null;
      if (dataType === "weather") {
        result = await fetchCurrentWeather(lat, lng);
      } else if (dataType === "waves") {
        result = await fetchWaveData(lat, lng);
      }

      // Cache only if we actually fetched something
      if (result) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
          localStorage.setItem(`${cacheKey}-time`, Date.now());
        } catch (_) {
          // ignore quota errors
        }
      }

      return result;
    } catch (error) {
      console.error("Weather data fetch failed:", error);
      return null;
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return {
    currentLocation,
    setCurrentLocation,
    forecastData,
    setForecastData,
    loading,
    loadingType,
    fetchLocationData,
    getWeatherIcon,
    getWeatherDescription,
  };
};
