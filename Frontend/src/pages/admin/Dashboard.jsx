// React core
import { useEffect, useState } from "react";
// Components
import Navbar from "../../components/Navbar";
// Ports data
import { useNavigate } from "react-router-dom";
import mindanaoPorts from "../../data/ports.json";

//Icons
import { Waves, Compass, Clock, ArrowUpDown, Droplet } from "lucide-react";
import { Droplets, Cloud, Gauge, Eye, Sun, Moon } from "lucide-react";

/**
 * Marine Dashboard - Main weather and safety monitoring interface
 * Displays current marine conditions, weather data, and rescue alerts
 */
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

  // Get user location
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

  // Fetch notifications
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

  // Fetch weather for selected port
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

  /**
   * Convert weather code to human readable description
   */
  const getWeatherDescription = (code) => {
    const weatherCodes = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Fog",
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

  /**
   * Get weather icon based on weather code and time of day
   */
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

  /**
   * Convert wind direction degrees to compass direction
   */
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

  /**
   * Format values with units and decimal places
   */
  const formatValue = (value, unit = "", decimals = 0) => {
    if (value === null || value === undefined) return "--";
    return `${value.toFixed(decimals)}${unit}`;
  };

  /**
   * Calculate marine safety index based on conditions
   */
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-blue-400 rounded-full animate-spin"></div>
            <div className="text-xl font-semibold text-white">
              Getting your location...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const safetyIndex = getSafetyIndex();

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />

      <div className="px-3 pt-20 sm:px-4 lg:pt-24 lg:px-6">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white truncate sm:text-3xl">
                Marine Dashboard
              </h1>
              <p className="text-sm text-gray-400 truncate sm:text-base">
                {selectedPort
                  ? `Viewing: ${selectedPort.port_name}`
                  : userLocation
                  ? `Current Position: ${userLocation.latitude.toFixed(
                      4
                    )}°N, ${userLocation.longitude.toFixed(4)}°E`
                  : "Location: Unknown"}
              </p>
            </div>

            <div className="flex flex-row gap-3 sm:flex-row sm:items-center sm:gap-4">
              <select
                className="w-full px-3 py-2 text-sm bg-[#1e1e1e] text-white rounded sm:text-base sm:px-4 sm:w-auto"
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
                <option value="">Select a Port</option>
                {mindanaoPorts.ports_of_mindanao.map((port) => (
                  <option key={port.port_name} value={port.port_name}>
                    {port.port_name} - {port.location}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative self-start p-2 text-white sm:self-auto"
              >
                <i className="text-lg bi bi-bell-fill sm:text-base"></i>
                {rescueNotifications.filter((n) => n.status === "pending")
                  .length > 0 && (
                  <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full -top-1 -right-1 sm:-right-4">
                    {
                      rescueNotifications.filter((n) => n.status === "pending")
                        .length
                    }
                  </span>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 mt-3 text-sm text-yellow-400 rounded bg-yellow-900/20 sm:px-4 sm:mt-4">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {portLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="flex items-center gap-3 p-4 mx-4 bg-[#1e1e1e] rounded-xl sm:p-6 sm:rounded-2xl">
              <div className="w-6 h-6 border-b-2 border-white rounded-full animate-spin sm:w-8 sm:h-8"></div>
              <div className="text-sm text-white sm:text-base">
                Loading port data...
              </div>
            </div>
          </div>
        )}

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="fixed right-2 left-2 top-45 z-50 bg-[#1e1e1e] rounded-xl shadow-2xl sm:left-auto sm:right-4 sm:w-80">
            <div className="p-3 border-b border-gray-700 sm:p-4">
              <h3 className="font-bold text-white">Rescue Notifications</h3>
              <p className="text-xs text-gray-400 sm:text-sm">
                {
                  rescueNotifications.filter((n) => n.status === "pending")
                    .length
                }{" "}
                pending
              </p>
            </div>
            <div className="overflow-y-auto max-h-64 sm:max-h-96">
              {rescueNotifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 sm:p-8">
                  No rescue requests
                </div>
              ) : (
                rescueNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 border-b border-gray-700"
                  >
                    <div className="text-sm font-semibold text-white sm:text-base">
                      Emergency Rescue
                    </div>
                    <div className="text-xs text-gray-300 sm:text-sm">
                      📍 {notification.latitude?.toFixed(4)}°N,{" "}
                      {notification.longitude?.toFixed(4)}°E
                    </div>
                    <div className="text-xs text-gray-400">
                      🕒 {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4 xl:gap-4 xl:h-[70vh]">
          {/* Left Panel - Full width on mobile, 3/4 on desktop */}
          <div className="xl:col-span-3">
            <div className="flex flex-col h-full gap-3 sm:gap-4">
              {/* Weather Overview */}
              <div className="p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
                <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-0">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl">
                      {weatherData &&
                        getWeatherIcon(
                          weatherData.current.weather_code,
                          weatherData.current.is_day
                        )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-white truncate sm:text-xl">
                        {selectedPort
                          ? `${selectedPort.port_name} Conditions`
                          : "Current Conditions"}
                      </h2>
                      <p className="text-sm text-gray-400 truncate sm:text-base">
                        {weatherData
                          ? getWeatherDescription(
                              weatherData.current.weather_code
                            )
                          : "--"}
                      </p>
                    </div>
                  </div>
                  <div className="px-2 py-1 text-xs text-center text-gray-400 rounded-lg bg-[#272727] sm:px-3 sm:py-2 sm:text-sm sm:rounded-xl">
                    Updated:{" "}
                    {weatherData
                      ? new Date(weatherData.current.time).toLocaleTimeString()
                      : "--:--"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
                  {[
                    {
                      label: "Temperature",
                      value: formatValue(
                        weatherData?.current?.temperature_2m,
                        "°C",
                        0
                      ),
                      subtext: `Feels ${formatValue(
                        weatherData?.current?.apparent_temperature,
                        "°C",
                        0
                      )}`,
                      icon: "bi-thermometer-half",
                    },
                    {
                      label: "Wind Speed",
                      value: formatValue(
                        weatherData?.current?.wind_speed_10m,
                        " km/h",
                        0
                      ),
                      subtext: `${degToCompass(
                        weatherData?.current?.wind_direction_10m
                      )} • Gusts ${formatValue(
                        weatherData?.current?.wind_gusts_10m,
                        " km/h",
                        0
                      )}`,
                      icon: "bi-wind",
                    },
                    {
                      label: "Wave Height",
                      value: formatValue(
                        waveData?.current?.wave_height,
                        " m",
                        1
                      ),
                      subtext: `Swell ${formatValue(
                        waveData?.current?.swell_wave_height,
                        " m",
                        1
                      )}`,
                      icon: "bi-tsunami",
                    },
                    {
                      label: "Precipitation",
                      value: formatValue(
                        weatherData?.current?.precipitation,
                        " mm",
                        0
                      ),
                      subtext: weatherData
                        ? getWeatherDescription(
                            weatherData.current.weather_code
                          )
                        : "--",
                      icon: "bi-droplet",
                    },
                  ].map((metric, index) => (
                    <div
                      key={index}
                      className="p-2 bg-[#272727] rounded-lg sm:p-3"
                    >
                      <div className="text-xs text-gray-400 sm:text-sm">
                        <i className={`bi ${metric.icon}`}></i> {metric.label}
                      </div>
                      <div className="text-base font-bold text-white sm:text-lg">
                        {metric.value}
                      </div>
                      <div className="text-xs text-gray-400 sm:text-xs">
                        {metric.subtext}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Info */}
              <div className="grid flex-1 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                <div className="p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
                  <h3 className="flex items-center gap-2 mb-3 text-sm font-bold text-white sm:text-base">
                    <i className="bi bi-water"></i> Wave Conditions
                  </h3>
                  <div className="space-y-2 sm:space-y-4">
                    {[
                      {
                        label: "Primary Swell Height",
                        value: formatValue(
                          waveData?.current?.swell_wave_height,
                          " m",
                          1
                        ),
                        icon: (
                          <ArrowUpDown className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" />
                        ),
                      },
                      {
                        label: "Primary Swell Direction",
                        value: degToCompass(
                          waveData?.current?.swell_wave_direction
                        ),
                        icon: (
                          <Compass className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" />
                        ),
                      },
                      {
                        label: "Secondary Swell Height",
                        value: formatValue(
                          waveData?.current?.secondary_swell_wave_height,
                          " m",
                          1
                        ),
                        icon: (
                          <ArrowUpDown className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" />
                        ),
                      },
                      {
                        label: "Secondary Swell Period",
                        value: formatValue(
                          waveData?.current?.secondary_swell_wave_period,
                          "s",
                          1
                        ),
                        icon: (
                          <Clock className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" />
                        ),
                      },
                      {
                        label: "Wave Direction",
                        value: degToCompass(waveData?.current?.wave_direction),
                        icon: (
                          <Waves className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" />
                        ),
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 text-xs transition-all duration-200 rounded-lg group hover:bg-[#272727] sm:text-sm"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          {item.icon}
                          <span className="text-gray-400">{item.label}</span>
                        </div>
                        <span className="px-2 py-1 font-semibold text-white transition-colors rounded bg-blue-700/30 group-hover:bg-blue-600/40 sm:px-3">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
                  <h3 className="flex items-center gap-2 mb-3 text-sm font-bold text-white sm:text-base">
                    <i className="bi bi-cloud-sun"></i> Atmospheric Conditions
                  </h3>
                  <div className="space-y-2 sm:space-y-4">
                    {[
                      {
                        label: "Humidity",
                        value: formatValue(
                          weatherData?.current?.relative_humidity_2m,
                          "%",
                          0
                        ),
                        icon: (
                          <Droplets className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" />
                        ),
                      },
                      {
                        label: "Cloud Cover",
                        value: formatValue(
                          weatherData?.current?.cloud_cover,
                          "%",
                          0
                        ),
                        icon: (
                          <Cloud className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" />
                        ),
                      },
                      {
                        label: "Pressure",
                        value: formatValue(
                          weatherData?.current?.surface_pressure,
                          " hPa",
                          0
                        ),
                        icon: (
                          <Gauge className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" />
                        ),
                      },
                      {
                        label: "Visibility",
                        value:
                          weatherData && weatherData.current?.weather_code <= 3
                            ? "Good"
                            : "Reduced",
                        icon: (
                          <Eye className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" />
                        ),
                      },
                      {
                        label: "Day/Night",
                        value: weatherData?.current?.is_day ? "Day" : "Night",
                        icon: weatherData?.current?.is_day ? (
                          <Sun className="w-4 h-4 text-yellow-400 sm:w-5 sm:h-5" />
                        ) : (
                          <Moon className="w-4 h-4 text-blue-300 sm:w-5 sm:h-5" />
                        ),
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 text-xs transition-all duration-200 rounded-lg group hover:bg-[#272727] sm:text-sm"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          {item.icon}
                          <span className="text-gray-400">{item.label}</span>
                        </div>
                        <span className="px-2 py-1 font-semibold text-white transition-colors rounded bg-blue-700/30 group-hover:bg-blue-600/40 sm:px-3">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Full width on mobile, 1/4 on desktop */}
          <div className="xl:col-span-1">
            <div className="flex flex-col h-full gap-3 sm:gap-4">
              <div className="p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
                <h3 className="flex items-center gap-2 mb-3 text-sm font-bold text-white sm:text-base">
                  <i className="bi bi-question-octagon"></i> Safety Index
                </h3>
                <div className="text-center">
                  <div className="text-xl font-bold text-white sm:text-2xl">
                    {safetyIndex || "--"}/10
                  </div>
                  <div className="w-full h-2 mt-2 bg-gray-700 rounded sm:mt-2">
                    <div
                      className="h-2 rounded bg-gradient-to-r from-green-500 to-yellow-500"
                      style={{ width: `${(safetyIndex || 0) * 10}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-400 sm:mt-1">
                    {safetyIndex >= 8
                      ? "Excellent"
                      : safetyIndex >= 6
                      ? "Good"
                      : safetyIndex >= 4
                      ? "Caution"
                      : "Poor"}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                    <i className="bi bi-exclamation-triangle"></i> Marine Alerts
                  </h3>
                  <span className="px-2 py-1 text-xs text-white bg-red-500 rounded sm:text-sm">
                    0 Active
                  </span>
                </div>
                <div className="text-sm text-center text-gray-400 sm:text-base">
                  No active alerts
                </div>
              </div>

              {/* Rescue Requests */}
              <div className="flex-1 p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate sm:text-base">
                        Rescue Requests
                      </h3>
                      <p className="text-xs text-red-200 sm:text-xs">
                        {
                          rescueNotifications.filter(
                            (n) => n.status === "pending"
                          ).length
                        }{" "}
                        pending
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm("Clear all rescue notifications?")) {
                          localStorage.setItem("rescueNotifications", "[]");
                          setRescueNotifications([]);
                        }
                      }}
                      className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-500/80 sm:text-sm sm:px-2"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {rescueNotifications.length > 0 ? (
                      rescueNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-2 rounded text-xs ${
                            notification.read ? "bg-gray-800" : "bg-red-900"
                          }`}
                        >
                          <div className="font-medium text-white">
                            Emergency
                          </div>
                          <div className="text-gray-300">
                            {notification.latitude?.toFixed(2)}°N,{" "}
                            {notification.longitude?.toFixed(2)}°E
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-gray-400 sm:text-base">
                        No rescue requests
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
