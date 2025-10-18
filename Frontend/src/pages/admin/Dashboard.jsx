// React core
import React, { useState, useEffect } from "react";
// Components
import Navbar from "../../components/Navbar";
// Ports data
import mindanaoPorts from "../../data/ports.json"; // Adjust path as needed

export default function DashboardPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [waveData, setWaveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPort, setSelectedPort] = useState(null);
  const [portLoading, setPortLoading] = useState(false);

  // Get user location first
  useEffect(() => {
    const getUserLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          await fetchWeatherData(latitude, longitude);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setError("Location access denied. Using default location.");
          // Fallback to a default location (Davao - Mindanao)
          const defaultLat = 7.0667;
          const defaultLng = 125.6333;
          setUserLocation({ latitude: defaultLat, longitude: defaultLng });
          fetchWeatherData(defaultLat, defaultLng);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    const fetchWeatherData = async (lat, lng) => {
      try {
        setLoading(true);
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
        const waveUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,swell_wave_height,swell_wave_direction,secondary_swell_wave_height,secondary_swell_wave_period&timezone=auto`;

        console.log("Fetching from:", weatherUrl);

        const [weatherResponse, waveResponse] = await Promise.all([
          fetch(weatherUrl).then((res) => {
            if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
            return res.json();
          }),
          fetch(waveUrl).then((res) => {
            if (!res.ok) throw new Error(`Wave API failed: ${res.status}`);
            return res.json();
          }),
        ]);

        setWeatherData(weatherResponse);
        setWaveData(waveResponse);
        setError(null);
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError(`Failed to load weather data: ${err.message}`);
        setDemoData();
      } finally {
        setLoading(false);
      }
    };

    const setDemoData = () => {
      setWeatherData({
        current: {
          temperature_2m: 28.5,
          apparent_temperature: 30.1,
          wind_speed_10m: 12.3,
          wind_direction_10m: 180,
          wind_gusts_10m: 18.1,
          precipitation: 0,
          weather_code: 1,
          relative_humidity_2m: 75,
          cloud_cover: 35,
          surface_pressure: 1010.2,
          time: new Date().toISOString(),
        },
      });

      setWaveData({
        current: {
          wave_height: 1.8,
          wave_direction: 150,
          swell_wave_height: 1.5,
          swell_wave_direction: 145,
          secondary_swell_wave_height: 0.6,
          secondary_swell_wave_period: 7.5,
        },
      });
    };

    getUserLocation();
  }, []);

  // Fetch weather data for selected port
  const handlePortChange = async (port) => {
    if (!port) return;

    setSelectedPort(port);
    setPortLoading(true);

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${port.latitude}&longitude=${port.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
      const waveUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${port.latitude}&longitude=${port.longitude}&current=wave_height,wave_direction,swell_wave_height,swell_wave_direction,secondary_swell_wave_height,secondary_swell_wave_period&timezone=auto`;

      const [weatherResponse, waveResponse] = await Promise.all([
        fetch(weatherUrl).then((res) => {
          if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
          return res.json();
        }),
        fetch(waveUrl).then((res) => {
          if (!res.ok) throw new Error(`Wave API failed: ${res.status}`);
          return res.json();
        }),
      ]);

      setWeatherData(weatherResponse);
      setWaveData(waveResponse);
      setError(null);
    } catch (err) {
      console.error("Error fetching port weather data:", err);
      setError(`Failed to load port weather data: ${err.message}`);
    } finally {
      setPortLoading(false);
    }
  };

  const getWeatherDescription = (code) => {
    const weatherCodes = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      80: "Rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
    };
    return weatherCodes[code] || "Unknown";
  };

  const getWeatherIcon = (code, isDay = true) => {
    const icons = {
      0: isDay ? "☀️" : "🌙",
      1: isDay ? "🌤️" : "🌤️",
      2: "⛅",
      3: "☁️",
      45: "🌫️",
      48: "🌫️",
      51: "🌦️",
      53: "🌦️",
      55: "🌧️",
      61: "🌦️",
      63: "🌧️",
      65: "⛈️",
      80: "🌦️",
      81: "🌧️",
      82: "⛈️",
    };
    return icons[code] || "❓";
  };

  const degToCompass = (degrees) => {
    if (degrees === null || degrees === undefined) return "--";
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  const formatValue = (value, unit = "", decimals = 0) => {
    if (value === null || value === undefined) return "--";
    return `${value.toFixed(decimals)}${unit}`;
  };

  const getSafetyIndex = () => {
    if (!weatherData || !waveData) return null;

    let score = 8; // Base score

    // Adjust based on conditions
    if (waveData.current.wave_height > 2.5) score -= 2;
    if (waveData.current.wave_height > 3.5) score -= 3;
    if (weatherData.current.wind_speed_10m > 25) score -= 2;
    if (weatherData.current.wind_speed_10m > 40) score -= 3;
    if (weatherData.current.precipitation > 5) score -= 1;
    if (weatherData.current.weather_code >= 61) score -= 1; // Rain
    if (weatherData.current.weather_code >= 80) score -= 1; // Showers

    return Math.max(1, Math.min(10, score));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0C0623] to-slate-800">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mb-4"></div>
          <div className="text-white text-xl font-semibold">
            Getting your location...
          </div>
          <div className="text-blue-300 text-sm mt-2">
            Please allow location access for accurate marine data
          </div>
        </div>
      </div>
    );
  }

  const safetyIndex = getSafetyIndex();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0C0623] to-slate-800">
      <Navbar />

      {/* Main Content */}
      <div className="p-20">
        {/* Header with Port Selector */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Marine Dashboard
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      selectedPort ? "bg-yellow-400" : "bg-green-400"
                    } animate-pulse`}
                  ></div>
                  <p className="text-blue-200 text-sm md:text-base">
                    {selectedPort
                      ? `Viewing: ${selectedPort.port_name}`
                      : userLocation
                      ? `Current Position: ${userLocation.latitude.toFixed(
                          4
                        )}°N, ${userLocation.longitude.toFixed(4)}°E`
                      : "Location: Unknown"}
                  </p>
                </div>
                {selectedPort && (
                  <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs border border-blue-500/30">
                    {selectedPort.location} • {selectedPort.type}
                  </span>
                )}
              </div>
            </div>

            {/* Port Selection */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-[280px]">
                <select
                  className="w-full bg-blue-900/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all backdrop-blur-sm appearance-none pr-10"
                  value={selectedPort ? selectedPort.port_name : ""}
                  onChange={(e) => {
                    const portName = e.target.value;
                    if (portName) {
                      const port = mindanaoPorts.ports_of_mindanao.find(
                        (p) => p.port_name === portName
                      );
                      handlePortChange(port);
                    } else {
                      setSelectedPort(null);
                      if (userLocation) {
                        fetchWeatherData(
                          userLocation.latitude,
                          userLocation.longitude
                        );
                      }
                    }
                  }}
                >
                  <option value="">Select a Port in Mindanao</option>
                  {mindanaoPorts.ports_of_mindanao.map((port) => (
                    <option key={port.port_name} value={port.port_name}>
                      {port.port_name} - {port.location}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 pointer-events-none">
                  ▼
                </div>
              </div>

              {selectedPort && (
                <button
                  onClick={() => {
                    setSelectedPort(null);
                    if (userLocation) {
                      fetchWeatherData(
                        userLocation.latitude,
                        userLocation.longitude
                      );
                    }
                  }}
                  className="bg-gray-600/50 hover:bg-gray-700/50 text-white px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap border border-gray-500/30 backdrop-blur-sm hover:scale-105 active:scale-95"
                >
                  Show My Location
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-900/20 border border-yellow-500/30 px-4 py-2 rounded-xl">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Loading overlay for port data */}
        {portLoading && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-blue-900/90 border border-blue-500/50 rounded-2xl p-6 flex items-center gap-4 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <div className="text-white text-lg">
                Loading port weather data...
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Weather Cards - Left Side */}
          <div className="xl:col-span-3 space-y-6">
            {/* Current Weather Overview */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/20 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                <div className="flex items-center gap-4 mb-4 lg:mb-0">
                  <div className="text-4xl">
                    {weatherData &&
                      getWeatherIcon(
                        weatherData.current.weather_code,
                        weatherData.current.is_day
                      )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedPort
                        ? `${selectedPort.port_name} Conditions`
                        : "Current Conditions"}
                    </h2>
                    <p className="text-blue-200 text-sm">
                      {weatherData
                        ? getWeatherDescription(
                            weatherData.current.weather_code
                          )
                        : "--"}
                    </p>
                  </div>
                </div>
                <div className="text-blue-200 text-sm bg-blue-800/30 px-3 py-2 rounded-lg">
                  Last updated:{" "}
                  {weatherData
                    ? new Date(weatherData.current.time).toLocaleTimeString()
                    : "--:--"}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Temperature */}
                <div className="bg-blue-800/20 rounded-xl p-4 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-300 text-sm">Temperature</span>
                    <span className="text-blue-400">🌡️</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatValue(weatherData?.current?.temperature_2m, "°C", 0)}
                  </div>
                  <div className="text-blue-300 text-xs">
                    Feels like{" "}
                    {formatValue(
                      weatherData?.current?.apparent_temperature,
                      "°C",
                      0
                    )}
                  </div>
                </div>

                {/* Wind */}
                <div className="bg-blue-800/20 rounded-xl p-4 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-300 text-sm">Wind Speed</span>
                    <span className="text-blue-400">💨</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatValue(
                      weatherData?.current?.wind_speed_10m,
                      " km/h",
                      0
                    )}
                  </div>
                  <div className="text-blue-300 text-xs">
                    {degToCompass(weatherData?.current?.wind_direction_10m)} •
                    Gusts:{" "}
                    {formatValue(
                      weatherData?.current?.wind_gusts_10m,
                      " km/h",
                      0
                    )}
                  </div>
                </div>

                {/* Wave Height */}
                <div className="bg-blue-800/20 rounded-xl p-4 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-300 text-sm">Wave Height</span>
                    <span className="text-blue-400">🌊</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatValue(waveData?.current?.wave_height, " m", 1)}
                  </div>
                  <div className="text-blue-300 text-xs">
                    Swell:{" "}
                    {formatValue(waveData?.current?.swell_wave_height, " m", 1)}
                  </div>
                </div>

                {/* Precipitation */}
                <div className="bg-blue-800/20 rounded-xl p-4 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-300 text-sm">Precipitation</span>
                    <span className="text-blue-400">💧</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatValue(weatherData?.current?.precipitation, " mm", 0)}
                  </div>
                  <div className="text-blue-300 text-xs">
                    {weatherData
                      ? getWeatherDescription(weatherData.current.weather_code)
                      : "--"}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Conditions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wave Information */}
              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/20 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>🌊</span>
                  Wave Conditions
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Primary Swell Height",
                      value: formatValue(
                        waveData?.current?.swell_wave_height,
                        " m",
                        1
                      ),
                      icon: "↕️",
                    },
                    {
                      label: "Primary Swell Direction",
                      value: degToCompass(
                        waveData?.current?.swell_wave_direction
                      ),
                      icon: "🧭",
                    },
                    {
                      label: "Secondary Swell Height",
                      value: formatValue(
                        waveData?.current?.secondary_swell_wave_height,
                        " m",
                        1
                      ),
                      icon: "↕️",
                    },
                    {
                      label: "Secondary Swell Period",
                      value: formatValue(
                        waveData?.current?.secondary_swell_wave_period,
                        "s",
                        1
                      ),
                      icon: "⏱️",
                    },
                    {
                      label: "Wave Direction",
                      value: degToCompass(waveData?.current?.wave_direction),
                      icon: "🌊",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between group hover:bg-blue-800/20 p-2 rounded-lg transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-blue-200 text-sm">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-white font-semibold bg-blue-700/30 px-3 py-1 rounded-lg group-hover:bg-blue-600/40 transition-colors">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather Details */}
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 rounded-2xl p-6 border border-purple-500/20 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>🌤️</span>
                  Atmospheric Conditions
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Humidity",
                      value: formatValue(
                        weatherData?.current?.relative_humidity_2m,
                        "%",
                        0
                      ),
                      icon: "💦",
                    },
                    {
                      label: "Cloud Cover",
                      value: formatValue(
                        weatherData?.current?.cloud_cover,
                        "%",
                        0
                      ),
                      icon: "☁️",
                    },
                    {
                      label: "Pressure",
                      value: formatValue(
                        weatherData?.current?.surface_pressure,
                        " hPa",
                        0
                      ),
                      icon: "📊",
                    },
                    {
                      label: "Visibility",
                      value:
                        weatherData && weatherData.current?.weather_code <= 3
                          ? "Good"
                          : "Reduced",
                      icon: "👁️",
                    },
                    {
                      label: "Day/Night",
                      value: weatherData?.current?.is_day ? "Day" : "Night",
                      icon: weatherData?.current?.is_day ? "☀️" : "🌙",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between group hover:bg-purple-800/20 p-2 rounded-lg transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-purple-200 text-sm">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-white font-semibold bg-purple-700/30 px-3 py-1 rounded-lg group-hover:bg-purple-600/40 transition-colors">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Safety Index */}
            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/20 rounded-2xl p-6 border border-green-500/20 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>🛡️</span>
                Safety Index
              </h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {safetyIndex || "--"}/10
                </div>
                <div className="w-full bg-gray-700/30 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(safetyIndex || 0) * 10}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-green-200 text-sm text-center">
                {safetyIndex >= 8
                  ? "Excellent Conditions"
                  : safetyIndex >= 6
                  ? "Good for Navigation"
                  : safetyIndex >= 4
                  ? "Exercise Caution"
                  : "Poor Conditions"}
              </div>
            </div>

            {/* Active Alerts */}
            <div className="bg-gradient-to-br from-red-900/40 to-orange-900/20 rounded-2xl p-6 border border-red-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⚠️</span>
                  Marine Alerts
                </h3>
                <div className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  0 Active
                </div>
              </div>
              <div className="text-center py-4">
                <div className="text-gray-300 mb-2 text-sm">
                  No active alerts
                </div>
                <div className="text-gray-500 text-xs">
                  Storm warnings and safety notices will appear here
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
