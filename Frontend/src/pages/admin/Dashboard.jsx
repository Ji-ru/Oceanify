// React core
import { useEffect, useState } from "react";
// Components
import Navbar from "../../components/Navbar";
// Ports data
import { useNavigate } from "react-router-dom";
import mindanaoPorts from "../../data/ports.json"; // Adjust path as needed

export default function DashboardPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [waveData, setWaveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPort, setSelectedPort] = useState(null);
  const [portLoading, setPortLoading] = useState(false);
  const [rescueNotifications, setRescueNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

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

    const fetchWeatherData = async (lat, lng, options = {}) => {
      const { usePortLoading = true, enableDemoData = true } = options;

      try {
        if (usePortLoading) {
          setPortLoading(true);
        } else {
          setLoading(true);
        }

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
        const waveUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,swell_wave_height,swell_wave_direction,secondary_swell_wave_height,secondary_swell_wave_period&timezone=auto`;

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

        return { weatherResponse, waveResponse };
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError(`Failed to load weather data: ${err.message}`);

        if (enableDemoData) {
          setDemoData();
        }

        throw err;
      } finally {
        if (usePortLoading) {
          setPortLoading(false);
        } else {
          setLoading(false);
        }
      }
    };

    const handlePortChange = async (port) => {
      if (!port) return;

      setSelectedPort(port);

      try {
        await fetchWeatherData(port.latitude, port.longitude, {
          usePortLoading: true,
          enableDemoData: false,
        });
      } catch (err) {
        console.error("Error in port change:", err);
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

  useEffect(() => {
    const fetchNotifications = () => {
      try {
        const notifications = JSON.parse(
          localStorage.getItem("rescueNotifications") || "[]"
        );
        setRescueNotifications(notifications);
      } catch (err) {
        console.error("Error fetching notifications", err);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

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
      "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
      "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  const formatValue = (value, unit = "", decimals = 0) => {
    if (value === null || value === undefined) return "--";
    return `${value.toFixed(decimals)}${unit}`;
  };

  const getSafetyIndex = () => {
    if (!weatherData || !waveData) return null;

    let score = 8;
    if (waveData.current.wave_height > 2.5) score -= 2;
    if (waveData.current.wave_height > 3.5) score -= 3;
    if (weatherData.current.wind_speed_10m > 25) score -= 2;
    if (weatherData.current.wind_speed_10m > 40) score -= 3;
    if (weatherData.current.precipitation > 5) score -= 1;
    if (weatherData.current.weather_code >= 61) score -= 1;
    if (weatherData.current.weather_code >= 80) score -= 1;

    return Math.max(1, Math.min(10, score));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0C0623] to-slate-800">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-16 h-16 mb-4 border-b-2 border-blue-400 rounded-full animate-spin"></div>
          <div className="text-xl font-semibold text-white">
            Getting your location...
          </div>
          <div className="mt-2 text-sm text-blue-300">
            Please allow location access for accurate marine data
          </div>
        </div>
      </div>
    );
  }

  const safetyIndex = getSafetyIndex();
  const pendingNotifications = rescueNotifications.filter(n => n.status === "pending").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0C0623] to-slate-800">
      <Navbar />

      {/* Main Content */}
      <div className="p-4 lg:p-8 mt-15">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <span className="text-2xl">🌊</span>
                </div>
                <h1 className="text-2xl font-bold text-white lg:text-3xl">
                  Marine Dashboard
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedPort ? "bg-yellow-400" : "bg-green-400"} animate-pulse`}></div>
                  <p className="text-sm text-blue-200">
                    {selectedPort 
                      ? `Viewing: ${selectedPort.port_name}` 
                      : userLocation 
                        ? `Current Position: ${userLocation.latitude.toFixed(4)}°N, ${userLocation.longitude.toFixed(4)}°E`
                        : "Location: Unknown"
                    }
                  </p>
                </div>
                {selectedPort && (
                  <span className="px-2 py-1 text-xs text-blue-300 border rounded-full bg-blue-500/20 border-blue-500/30">
                    {selectedPort.location} • {selectedPort.type}
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3 text-white transition-all duration-200 border bg-blue-900/50 hover:bg-blue-800/50 rounded-xl border-blue-500/30 backdrop-blur-sm hover:scale-105 active:scale-95"
                  title="Rescue Notifications"
                >
                  <span className="text-xl">🔔</span>
                  {pendingNotifications > 0 && (
                    <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full -top-1 -right-1 animate-pulse">
                      {pendingNotifications}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-2 overflow-hidden border shadow-2xl w-80 bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-xl border-blue-500/30 backdrop-blur-sm">
                    <div className="p-3 border-b bg-blue-900/30 border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white">Rescue Notifications</h3>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-xl text-gray-400 transition-colors hover:text-white"
                        >
                          ×
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-blue-200">
                        {pendingNotifications} pending
                      </p>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {rescueNotifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <div className="mb-2 text-3xl">🔔</div>
                          <p className="text-gray-400">No rescue requests</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-2">
                          {rescueNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                notification.read
                                  ? "bg-gray-800/30 border-gray-700/30"
                                  : "bg-red-900/30 border-red-500/30"
                              }`}
                              onClick={() => {
                                const updated = rescueNotifications.map((n) =>
                                  n.id === notification.id ? { ...n, read: true } : n
                                );
                                setRescueNotifications(updated);
                                localStorage.setItem("rescueNotifications", JSON.stringify(updated));
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 text-xl">🆘</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white">
                                    Emergency Rescue
                                  </p>
                                  <p className="mt-1 text-xs text-gray-300">
                                    📍 {notification.latitude.toFixed(4)}°N, {notification.longitude.toFixed(4)}°E
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    🕒 {new Date(notification.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {rescueNotifications.length > 0 && (
                      <div className="p-3 border-t bg-slate-800/30 border-blue-500/20">
                        <button
                          onClick={() => {
                            if (window.confirm("Clear all notifications?")) {
                              localStorage.setItem("rescueNotifications", "[]");
                              setRescueNotifications([]);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm font-semibold text-white transition-all bg-red-600 rounded-lg hover:bg-red-700"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Port Selection */}
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <select
                    className="w-full px-3 py-2.5 pr-8 text-white transition-all border appearance-none bg-blue-900/50 border-blue-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm text-sm"
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
                          fetchWeatherData(userLocation.latitude, userLocation.longitude);
                        }
                      }
                    }}
                  >
                    <option value="">Select a Port</option>
                    {mindanaoPorts.ports_of_mindanao.map((port) => (
                      <option key={port.port_name} value={port.port_name}>
                        {port.port_name} - {port.location}
                      </option>
                    ))}
                  </select>
                  <div className="absolute text-blue-300 transform -translate-y-1/2 pointer-events-none right-2 top-1/2 text-sm">
                    ▼
                  </div>
                </div>

                {selectedPort && (
                  <button
                    onClick={() => {
                      setSelectedPort(null);
                      if (userLocation) {
                        fetchWeatherData(userLocation.latitude, userLocation.longitude);
                      }
                    }}
                    className="px-3 py-2.5 text-sm text-white transition-all duration-200 border bg-gray-600/50 hover:bg-gray-700/50 rounded-xl whitespace-nowrap border-gray-500/30 backdrop-blur-sm"
                  >
                    My Location
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-yellow-400 border bg-yellow-900/20 border-yellow-500/30 rounded-xl">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {portLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 p-4 border bg-blue-900/90 border-blue-500/50 rounded-xl backdrop-blur-sm">
              <div className="w-6 h-6 border-b-2 border-white rounded-full animate-spin"></div>
              <div className="text-white">Loading port data...</div>
            </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          {/* Primary Weather Data */}
          <div className="xl:col-span-3">
            {/* Current Conditions Card */}
            <div className="p-6 mb-6 border bg-gradient-to-br from-blue-900/40 to-purple-900/20 rounded-2xl border-blue-500/20 backdrop-blur-sm">
              <div className="flex flex-col justify-between mb-6 lg:flex-row lg:items-center">
                <div className="flex items-center gap-4 mb-4 lg:mb-0">
                  <div className="text-5xl">
                    {weatherData && getWeatherIcon(weatherData.current.weather_code, weatherData.current.is_day)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedPort ? `${selectedPort.port_name}` : "Current Location"}
                    </h2>
                    <p className="text-blue-200">
                      {weatherData ? getWeatherDescription(weatherData.current.weather_code) : "--"}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-blue-200">
                  Updated: {weatherData ? new Date(weatherData.current.time).toLocaleTimeString() : "--:--"}
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  {
                    label: "Temperature",
                    value: formatValue(weatherData?.current?.temperature_2m, "°C", 0),
                    secondary: `Feels like ${formatValue(weatherData?.current?.apparent_temperature, "°C", 0)}`,
                    icon: "🌡️",
                    color: "from-blue-500/20 to-cyan-500/20"
                  },
                  {
                    label: "Wind Speed",
                    value: formatValue(weatherData?.current?.wind_speed_10m, " km/h", 0),
                    secondary: `${degToCompass(weatherData?.current?.wind_direction_10m)} • Gusts: ${formatValue(weatherData?.current?.wind_gusts_10m, " km/h", 0)}`,
                    icon: "💨",
                    color: "from-cyan-500/20 to-blue-500/20"
                  },
                  {
                    label: "Wave Height",
                    value: formatValue(waveData?.current?.wave_height, " m", 1),
                    secondary: `Swell: ${formatValue(waveData?.current?.swell_wave_height, " m", 1)}`,
                    icon: "🌊",
                    color: "from-purple-500/20 to-blue-500/20"
                  },
                  {
                    label: "Precipitation",
                    value: formatValue(weatherData?.current?.precipitation, " mm", 0),
                    secondary: weatherData ? getWeatherDescription(weatherData.current.weather_code) : "--",
                    icon: "💧",
                    color: "from-blue-500/20 to-indigo-500/20"
                  }
                ].map((metric, index) => (
                  <div key={index} className={`p-4 bg-gradient-to-br ${metric.color} border border-blue-500/10 rounded-xl backdrop-blur-sm`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-300">{metric.label}</span>
                      <span className="text-lg">{metric.icon}</span>
                    </div>
                    <div className="mb-1 text-2xl font-bold text-white">{metric.value}</div>
                    <div className="text-xs text-blue-300">{metric.secondary}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Conditions */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Wave Conditions */}
              <div className="p-6 border bg-gradient-to-br from-blue-900/40 to-cyan-900/20 rounded-2xl border-blue-500/20 backdrop-blur-sm">
                <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-white">
                  <span className="text-xl">🌊</span>
                  Wave Conditions
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Primary Swell Height", value: formatValue(waveData?.current?.swell_wave_height, " m", 1), icon: "↕️" },
                    { label: "Primary Swell Direction", value: degToCompass(waveData?.current?.swell_wave_direction), icon: "🧭" },
                    { label: "Secondary Swell Height", value: formatValue(waveData?.current?.secondary_swell_wave_height, " m", 1), icon: "↕️" },
                    { label: "Secondary Swell Period", value: formatValue(waveData?.current?.secondary_swell_wave_period, "s", 1), icon: "⏱️" },
                    { label: "Wave Direction", value: degToCompass(waveData?.current?.wave_direction), icon: "🌊" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-blue-800/10">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm text-blue-200">{item.label}</span>
                      </div>
                      <span className="font-semibold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Atmospheric Conditions */}
              <div className="p-6 border bg-gradient-to-br from-purple-900/40 to-pink-900/20 rounded-2xl border-purple-500/20 backdrop-blur-sm">
                <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-white">
                  <span className="text-xl">🌤️</span>
                  Atmospheric Conditions
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Humidity", value: formatValue(weatherData?.current?.relative_humidity_2m, "%", 0), icon: "💦" },
                    { label: "Cloud Cover", value: formatValue(weatherData?.current?.cloud_cover, "%", 0), icon: "☁️" },
                    { label: "Pressure", value: formatValue(weatherData?.current?.surface_pressure, " hPa", 0), icon: "📊" },
                    { label: "Visibility", value: weatherData && weatherData.current?.weather_code <= 3 ? "Good" : "Reduced", icon: "👁️" },
                    { label: "Day/Night", value: weatherData?.current?.is_day ? "Day" : "Night", icon: weatherData?.current?.is_day ? "☀️" : "🌙" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-purple-800/10">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm text-purple-200">{item.label}</span>
                      </div>
                      <span className="font-semibold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Safety Index */}
            <div className="p-6 border bg-gradient-to-br from-green-900/40 to-emerald-900/20 rounded-2xl border-green-500/20 backdrop-blur-sm">
              <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-white">
                <span className="text-xl">🛡️</span>
                Safety Index
              </h3>
              <div className="text-center">
                <div className="mb-3 text-4xl font-bold text-green-400">
                  {safetyIndex || "--"}/10
                </div>
                <div className="w-full h-2 mb-4 rounded-full bg-gray-700/30">
                  <div
                    className="h-2 transition-all duration-1000 ease-out rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                    style={{ width: `${(safetyIndex || 0) * 10}%` }}
                  ></div>
                </div>
                <div className="text-sm text-green-200">
                  {safetyIndex >= 8
                    ? "Excellent Conditions"
                    : safetyIndex >= 6
                    ? "Good for Navigation"
                    : safetyIndex >= 4
                    ? "Exercise Caution"
                    : "Poor Conditions"}
                </div>
              </div>
            </div>

            {/* Marine Alerts */}
            <div className="p-6 border bg-gradient-to-br from-red-900/40 to-orange-900/20 rounded-2xl border-red-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <span className="text-xl">⚠️</span>
                  Marine Alerts
                </h3>
                <div className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                  0 Active
                </div>
              </div>
              <div className="py-4 text-center">
                <div className="text-sm text-gray-300">No active alerts</div>
                <div className="text-xs text-gray-500 mt-1">
                  Storm warnings and safety notices will appear here
                </div>
              </div>
            </div>

            {/* Rescue Notifications Summary */}
            {pendingNotifications > 0 && (
              <div className="p-6 border bg-gradient-to-br from-red-900/40 to-orange-900/20 rounded-2xl border-red-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-full animate-pulse">
                    <span className="text-xl">🆘</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Rescue Alert</h3>
                    <p className="text-sm text-red-200">{pendingNotifications} active request(s)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotifications(true)}
                  className="w-full px-4 py-2 text-sm font-semibold text-white transition-all bg-red-600 rounded-lg hover:bg-red-700"
                >
                  View Details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}