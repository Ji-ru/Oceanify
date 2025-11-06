// React core
import { useEffect, useState } from "react";
// Components
import Navbar from "../../components/Navbar";
// Ports data
import { useNavigate } from "react-router-dom";
import mindanaoPorts from "../../data/ports.json";
// Data clients
import supabase from "../../supabaseClient";
import API from "../../api";
// Weather hook (provides cached fetch)
import { useWeatherData } from "../../hooks/useWeatherData";

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

  // New: live rescue requests and admin alerts
  const [rescueRequests, setRescueRequests] = useState([]);
  const [adminAlerts, setAdminAlerts] = useState([]);

  const { fetchLocationData } = useWeatherData();

  // Helper: load weather and waves via cached hook
  const loadByCoords = async (lat, lng, opts = { setGlobalLoading: false }) => {
    try {
      if (opts.setGlobalLoading) setLoading(true);
      const [currentWeather, currentWaves] = await Promise.all([
        fetchLocationData(lat, lng, "weather"),
        fetchLocationData(lat, lng, "waves"),
      ]);
      if (currentWeather) setWeatherData(currentWeather);
      if (currentWaves) setWaveData(currentWaves);
      setError(null);
    } catch (e) {
      setError("Failed to load location weather data.");
    } finally {
      if (opts.setGlobalLoading) setLoading(false);
    }
  };

  // Get user location
  useEffect(() => {
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

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
          is_day: 1,
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

    const getUserLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          await loadByCoords(latitude, longitude, { setGlobalLoading: true });
        },
        async (err) => {
          console.warn("Geolocation error:", err);
          setError("Location access denied. Using default location.");
          const defaultLat = 7.0667;
          const defaultLng = 125.6333;
          setUserLocation({ latitude: defaultLat, longitude: defaultLng });
          try {
            await loadByCoords(defaultLat, defaultLng, { setGlobalLoading: true });
          } catch {
            setDemoData();
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    // Check cached data FIRST
    const cachedLocation = JSON.parse(localStorage.getItem("cachedLocation"));
    const cachedWeather = JSON.parse(localStorage.getItem("cachedWeather"));
    const cachedWave = JSON.parse(localStorage.getItem("cachedWave"));
    const cacheTime = localStorage.getItem("cacheTime");

    if (cachedLocation && cachedWeather && cachedWave && cacheTime) {
      const isExpired = Date.now() - cacheTime > CACHE_DURATION;

      if (!isExpired) {
        setUserLocation(cachedLocation);
        setWeatherData(cachedWeather);
        setWaveData(cachedWave);
        setLoading(false);
        return; // Stop here if using cache
      }
    }

    // If no valid cache → get location
    getUserLocation();
  }, []);

  // Fetch notifications (legacy local) - kept for header dropdown
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

  // Load rescue requests from Supabase with realtime like AdminRescueManagement
  useEffect(() => {
    const loadRescueRequests = async () => {
      try {
        const { data, error } = await supabase
          .from("rescue_requests")
          .select("*")
          .order("timestamp", { ascending: false });
        if (error) throw error;
        setRescueRequests(data || []);
      } catch (err) {
        console.error("Failed to load rescue requests:", err);
      }
    };

    loadRescueRequests();

    const channel = supabase
      .channel("rescue_requests_changes_dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rescue_requests" },
        () => loadRescueRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load simple admin alerts via API, fallback to Supabase
  useEffect(() => {
    let canceled = false;
    const loadAlerts = async () => {
      try {
        const res = await API.get("/alerts");
        if (!canceled) setAdminAlerts(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        try {
          const { data, error } = await supabase
            .from("alerts")
            .select("*")
            .order("time", { ascending: false })
            .limit(10);
          if (!error && !canceled) setAdminAlerts(data || []);
        } catch {}
      }
    };
    loadAlerts();
    const interval = setInterval(loadAlerts, 20000);
    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, []);

  // Fetch weather for selected port
  const handlePortChange = async (port) => {
    if (!port) return;
    setSelectedPort(port);
    setPortLoading(true);
    try {
      await loadByCoords(port.latitude, port.longitude);
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
      "North",
      "North-NorthEast",
      "NorthEast",
      "East-NorthEast",
      "East",
      "East-SouthEast",
      "SouthEast",
      "South-SouthEast",
      "South",
      "South-SouthWest",
      "SouthWest",
      "West-SouthWest",
      "West",
      "West-NorthWest",
      "NorthWest",
      "North-NorthWest",
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

  // Add these helper functions before getSafetyIndex()

  const getBeaufortScale = (windSpeed) => {
    if (windSpeed <= 1) return { score: 100, level: "Calm" };
    if (windSpeed <= 5) return { score: 90, level: "Light Air" };
    if (windSpeed <= 11) return { score: 80, level: "Light Breeze" };
    if (windSpeed <= 19) return { score: 70, level: "Gentle Breeze" };
    if (windSpeed <= 28) return { score: 60, level: "Moderate Breeze" };
    if (windSpeed <= 38) return { score: 50, level: "Fresh Breeze" };
    if (windSpeed <= 49) return { score: 40, level: "Strong Breeze" };
    if (windSpeed <= 61) return { score: 30, level: "Near Gale" };
    if (windSpeed <= 74) return { score: 20, level: "Gale" };
    if (windSpeed <= 88) return { score: 10, level: "Strong Gale" };
    return { score: 0, level: "Storm" };
  };

  const getDouglasScale = (waveHeight) => {
    if (waveHeight <= 0.1) return { score: 100, level: "Calm" };
    if (waveHeight <= 0.5) return { score: 90, level: "Smooth" };
    if (waveHeight <= 1.25) return { score: 80, level: "Slight" };
    if (waveHeight <= 2.5) return { score: 60, level: "Moderate" };
    if (waveHeight <= 4.0) return { score: 40, level: "Rough" };
    if (waveHeight <= 6.0) return { score: 20, level: "Very Rough" };
    if (waveHeight <= 9.0) return { score: 10, level: "High" };
    return { score: 0, level: "Very High" };
  };

  const getWeatherRiskLevel = (weatherCode) => {
    // Clear to partly cloudy - safe
    if (weatherCode <= 2) return { score: 100, level: "Clear" };
    // Overcast - slightly reduced safety
    if (weatherCode <= 3) return { score: 80, level: "Overcast" };
    // Fog - reduced visibility
    if (weatherCode <= 48) return { score: 60, level: "Fog" };
    // Drizzle to rain - moderate risk
    if (weatherCode <= 67) return { score: 50, level: "Rain" };
    // Rain showers to thunderstorm - high risk
    return { score: 30, level: "Storm" };
  };

  const getSafetyLevel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Moderate";
    if (score >= 20) return "Poor";
    return "Dangerous";
  };
  /**
   * Calculate marine safety index based on conditions
   * Uses Beaufort Scale for wind and Douglas Sea Scale for waves
   */
  const getSafetyIndex = () => {
    try {
      if (!weatherData || !waveData) return null;

      const beaufortLevel = getBeaufortScale(
        weatherData.current.wind_speed_10m
      );
      const douglasLevel = getDouglasScale(waveData.current.wave_height);
      const weatherLevel = getWeatherRiskLevel(
        weatherData.current.weather_code
      );

      // Combine scales with weights
      const safetyScore =
        beaufortLevel.score * 0.4 +
        douglasLevel.score * 0.4 +
        weatherLevel.score * 0.2;

      return {
        score: Math.round(safetyScore / 10), // Divide by 10 to get 0-10 scale
        level: getSafetyLevel(safetyScore),
        details: {
          wind: beaufortLevel,
          waves: douglasLevel,
          weather: weatherLevel,
        },
      };
    } catch (error) {
      console.error("Safety index calculation error:", error);
      return { score: 5, level: "Unknown", details: {} };
    }
  };

  // Seafarer advisory based on current conditions
  const getSeaAdvisory = () => {
    try {
      if (!weatherData || !waveData) return { severity: "unknown", message: "--" };

      const wind = weatherData.current?.wind_speed_10m ?? 0; // km/h
      const gusts = weatherData.current?.wind_gusts_10m ?? 0; // km/h
      const waves = waveData.current?.wave_height ?? 0; // m
      const swell = waveData.current?.swell_wave_height ?? 0; // m
      const code = weatherData.current?.weather_code ?? 0;
      const isFog = code === 45 || code === 48;
      const isHeavyRain = code >= 61; // rain and above

      // Danger conditions (do not sail)
      if (waves >= 3.0 || gusts >= 60 || code >= 80) {
        return {
          severity: "danger",
          message: "Danger: Very rough seas or severe weather. Small boats should not depart.",
        };
      }

      // Caution conditions (experienced only / coastal)
      if (waves >= 2.0 || wind >= 35 || isHeavyRain || isFog) {
        let reasons = [];
        if (waves >= 2.0) reasons.push("waves 2.0m+");
        if (wind >= 35) reasons.push("strong wind 35+ km/h");
        if (isHeavyRain) reasons.push("rain reduces visibility");
        if (isFog) reasons.push("fog conditions");
        return {
          severity: "caution",
          message: `Caution: ${reasons.join(", ")}. Stay near shore and monitor updates.`,
        };
      }

      // Generally okay
      if (waves <= 1.5 && wind <= 25 && !isHeavyRain && !isFog) {
        return {
          severity: "ok",
          message: "Good conditions: Light-to-moderate winds and low waves. Keep standard safety gear.",
        };
      }

      // Default moderate
      return {
        severity: "caution",
        message: "Moderate conditions: Check equipment and local advisories before departure.",
      };
    } catch (e) {
      return { severity: "unknown", message: "--" };
    }
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
  const advisory = getSeaAdvisory();

  // Derived simple counts for UI
  const pendingRescueCount = rescueRequests.filter((r) => r.status === "pending").length;
  const acknowlegdedRescueCount = rescueRequests.filter((r) => r.status === "acknowledged").length;

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
                      loadByCoords(userLocation.latitude, userLocation.longitude);
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
                        <i className={`i bi ${metric.icon}`}></i> {metric.label}
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
                    {safetyIndex?.score || "--"}/10
                  </div>
                  <div className="w-full h-2 mt-2 bg-gray-700 rounded sm:mt-2">
                    <div
                      className="h-2 rounded bg-gradient-to-r from-green-500 to-yellow-500"
                      style={{ width: `${(safetyIndex?.score || 0) * 10}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-400 sm:mt-1">
                    {safetyIndex?.level || "Loading..."}
                  </div>

                  {/* Seafarer advisory */}
                  <div className="mt-3 text-left">
                    {advisory.severity === "danger" && (
                      <div className="p-3 text-sm text-red-200 bg-red-900/30 border border-red-700/40 rounded-lg">
                        ⚠️ {advisory.message}
                      </div>
                    )}
                    {advisory.severity === "caution" && (
                      <div className="p-3 text-sm text-amber-200 bg-amber-900/30 border border-amber-700/40 rounded-lg">
                        ⚠️ {advisory.message}
                      </div>
                    )}
                    {advisory.severity === "ok" && (
                      <div className="p-3 text-sm text-green-200 bg-green-900/30 border border-green-700/40 rounded-lg">
                        ✅ {advisory.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Simple Marine Alerts from AlertMGMT */}
              <div className="p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                    <i className="bi bi-exclamation-triangle"></i> Marine Alerts
                  </h3>
                  <span className="px-2 py-1 text-xs text-white bg-red-500 rounded sm:text-sm">
                    {adminAlerts.length} Active
                  </span>
                </div>
                {adminAlerts.length === 0 ? (
                  <div className="text-sm text-center text-gray-400 sm:text-base">
                    No active alerts
                  </div>
                ) : (
                  <ul className="space-y-2 text-sm text-white">
                    {adminAlerts.slice(0, 5).map((a) => (
                      <li key={a.id} className="p-2 rounded bg-[#272727]">
                        <div className="font-semibold truncate">{a.title || "Alert"}</div>
                        <div className="text-xs text-gray-400 truncate">{new Date(a.time).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Rescue Requests (simple) */}
              <div className="flex-1 p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate sm:text-base">
                        Rescue Requests
                      </h3>
                      <div className="flex flex-row gap-5">
                        <p className="text-xs text-red-200 sm:text-xs">
                          {pendingRescueCount} - pending
                        </p>
                        <p className="text-xs text-green-200 sm:text-xs">{acknowlegdedRescueCount} - acknowledge</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {rescueRequests.length > 0 ? (
                      rescueRequests.slice(0, 8).map((request) => (
                        <div key={request.id} className={`p-2 rounded text-xs ${request.status === "pending" ? "bg-red-900" : "bg-gray-800"}`}>
                          <div className="font-medium text-white truncate">
                            {request.reason?.toString().replace(/_/g, " ").toUpperCase() || "EMERGENCY"}
                          </div>
                          <div className="text-gray-300 truncate">
                            {request.latitude?.toFixed(2)}°N, {request.longitude?.toFixed(2)}°E
                          </div>
                          <div className="text-gray-400">{new Date(request.timestamp).toLocaleString()}</div>
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
