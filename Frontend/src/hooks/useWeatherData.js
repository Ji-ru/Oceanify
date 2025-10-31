import { useState } from 'react';
import { fetchForecastData, fetchCurrentWeather, fetchWaveData } from '../utils/weatherApi';
import { getWeatherIcon, getWeatherDescription } from '../utils/weatherUtils';

export const useWeatherData = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);

  const fetchLocationData = async (lat, lng, dataType) => {
    setLoading(true);
    setLoadingType(dataType);
    
    try {
      const forecast = await fetchForecastData(lat, lng);
      setForecastData(forecast);

      if (dataType === 'weather') {
        return await fetchCurrentWeather(lat, lng);
      } else if (dataType === 'waves') {
        return await fetchWaveData(lat, lng);
      }
      return null;
    } catch (error) {
      console.error('Weather data fetch failed:', error);
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
    getWeatherDescription
  };
};