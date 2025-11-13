// React core
import { useEffect, useState } from "react";
// Components
import Navbar from "../../components/Navbar";
// Ports data
import mindanaoPorts from "../../data/ports.json";
// Data clients
import supabase from "../../supabaseClient";
import API from "../../api";
// Weather hook (provides cached fetch)
import { useWeatherData } from "../../hooks/useWeatherForecastingData";
//Icons
// import { Waves, Compass, Clock, ArrowUpDown, Droplet } from "lucide-react";
// import { Droplets, Cloud, Gauge, Eye, Sun, Moon } from "lucide-react";

// Coordinate Formatter
import { useFormattedCoordinates } from "../../hooks/useFormattedCoords";

// Caching in Local Storage
import { useLocalStorage } from "../../hooks/useLocalStorage";

/**
 * Marine Dashboard - Main weather and safety monitoring interface
 * Displays current marine conditions, weather data, and rescue alerts
 */

export default function DashboardPage() {
  const [userLocation, setUserLocation] = useLocalStorage(
    "cachedLocation",
    null
  );
  const [weatherData, setWeatherData] = useLocalStorage("cachedWeather", null);
  const [waveData, setWaveData] = useLocalStorage("cachedWave", null);
  const [cacheTime, setCacheTime] = useLocalStorage("cacheTime", null);
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

  const { formattedCoords } = useFormattedCoordinates(userLocation);

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

  const getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        await loadByCoords(latitude, longitude, { setGlobalLoading: true });
      },
      async (err) => {
        console.warn("Geolocation error:", err);
        setError("Location access denied. Using default location.");
        const defaultLat = 7.0667;
        const defaultLng = 125.6333;
        setUserLocation({ lat: defaultLat, lng: defaultLng });
        try {
          await loadByCoords(defaultLat, defaultLng, {
            setGlobalLoading: true,
          });
        } catch {
          // setDemoData();
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    const isExpired = cacheTime && Date.now() - cacheTime > CACHE_DURATION;

    if (userLocation && weatherData && waveData && !isExpired) {
      setLoading(false);
      return; // Cache is valid — use it
    }

    // If cache missing or expired → refresh location and weather
    getUserLocation();
  }, []);

  // Whenever data changes, update cache time
  useEffect(() => {
    if (userLocation && weatherData && waveData) {
      setCacheTime(Date.now());
    }
  }, [userLocation, weatherData, waveData]);

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
      if (!weatherData || !waveData)
        return { severity: "unknown", message: "--" };

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
          message:
            "Danger: Very rough seas or severe weather. Small boats should not depart.",
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
          message: `Caution: ${reasons.join(
            ", "
          )}. Stay near shore and monitor updates.`,
        };
      }

      // Generally okay
      if (waves <= 1.5 && wind <= 25 && !isHeavyRain && !isFog) {
        return {
          severity: "ok",
          message:
            "Good conditions: Light-to-moderate winds and low waves. Keep standard safety gear.",
        };
      }

      // Default moderate
      return {
        severity: "caution",
        message:
          "Moderate conditions: Check equipment and local advisories before departure.",
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
  const pendingRescueCount = rescueRequests.filter(
    (r) => r.status === "pending"
  ).length;
  const acknowlegdedRescueCount = rescueRequests.filter(
    (r) => r.status === "acknowledged"
  ).length;

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-10">
      <Navbar />

      <div className="px-4 pt-20 sm:px-6 lg:pt-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Oceanify
              </h1>
              <p className="text-sm text-gray-400 sm:text-base">
                {selectedPort
                  ? `Viewing: ${selectedPort.port_name}`
                  : userLocation
                  ? `Current Position: ${formattedCoords}`
                  : "Location: Unknown"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <select
                className="px-4 py-2 text-sm bg-[#1e1e1e] text-white rounded-lg sm:text-base"
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
                      loadByCoords(
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
                className="relative p-2 text-white"
              >
                <i className="text-lg bi bi-bell-fill"></i>
                {rescueNotifications.filter((n) => n.status === "pending")
                  .length > 0 && (
                  <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">
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
            <div className="px-4 py-2 mt-4 text-sm text-yellow-400 rounded-lg bg-yellow-900/20">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {portLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="flex items-center gap-3 p-6 bg-[#1e1e1e] rounded-2xl">
              <div className="w-8 h-8 border-b-2 border-white rounded-full animate-spin"></div>
              <div className="text-white">Loading port data...</div>
            </div>
          </div>
        )}

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="fixed right-4 top-20 z-50 w-80 bg-[#1e1e1e] rounded-xl shadow-2xl">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-bold text-white">Rescue Notifications</h3>
              <p className="text-sm text-gray-400">
                {
                  rescueNotifications.filter((n) => n.status === "pending")
                    .length
                }{" "}
                pending
              </p>
            </div>
            <div className="overflow-y-auto max-h-96">
              {rescueNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No rescue requests
                </div>
              ) : (
                rescueNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b border-gray-700"
                  >
                    <div className="font-semibold text-white">
                      Emergency Rescue
                    </div>
                    <div className="text-sm text-gray-300">
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

        {/* Main Grid - New Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Weather Overview */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Temperature Card */}
              <div className="p-6 bg-[#1e1e1e] rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🌡️</div>
                  <div>
                    <h3 className="font-bold text-white">Temperature</h3>
                    <p className="text-2xl font-bold text-white">
                      {formatValue(
                        weatherData?.current?.temperature_2m,
                        "°C",
                        0
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">Fuel: 5°C</p>
              </div>

              {/* Wind Speed Card */}
              <div className="p-6 bg-[#1e1e1e] rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">💨</div>
                  <div>
                    <h3 className="font-bold text-white">Wind Speed</h3>
                    <p className="text-2xl font-bold text-white">
                      {formatValue(
                        weatherData?.current?.wind_speed_10m,
                        " km/h",
                        0
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">South Coast 21 km/h</p>
              </div>

              {/* Wave Conditions */}
              <div className="p-6 bg-[#1e1e1e] rounded-xl md:col-span-2">
                <h3 className="mb-4 text-lg font-bold text-white">
                  Wave Conditions
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: "Primary Swell Height",
                      value: formatValue(
                        waveData?.current?.wave_height,
                        " m",
                        1
                      ),
                    },
                    {
                      label: "Primary Swell Direction",
                      value: degToCompass(waveData?.current?.wave_direction),
                    },
                    {
                      label: "Secondary Swell Height",
                      value: formatValue(
                        waveData?.current?.secondary_swell_wave_height,
                        " m",
                        1
                      ),
                    },
                    {
                      label: "Secondary Swell Period",
                      value: formatValue(
                        waveData?.current?.secondary_swell_wave_period,
                        "s",
                        1
                      ),
                    },
                  ].map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-[#272727]">
                      <div className="text-sm text-gray-400">{item.label}</div>
                      <div className="text-lg font-semibold text-white">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Atmospheric Conditions */}
              <div className="p-6 bg-[#1e1e1e] rounded-xl md:col-span-2 ">
                <h3 className="mb-4 text-lg font-bold text-white">
                  Atmospheric Conditions
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[
                    {
                      label: "Humidity",
                      value: formatValue(
                        weatherData?.current?.relative_humidity_2m,
                        "%",
                        0
                      ),
                      icon: "💧",
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
                        weatherData?.current?.weather_code <= 3
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
                    <div key={index} className="p-3 rounded-lg bg-[#272727]">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{item.icon}</span>
                        <div className="text-sm text-gray-400">
                          {item.label}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Alerts & Safety */}
          <div className="space-y-6">
            {/* Marine Alerts */}
            <div className="p-6 bg-[#1e1e1e] rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Marine Alerts</h3>
                <span className="px-2 py-1 text-xs text-white bg-red-500 rounded">
                  {adminAlerts.length} Active
                </span>
              </div>
              {adminAlerts.length === 0 ? (
                <div className="text-center text-gray-400">
                  No active alerts
                </div>
              ) : (
                <div className="space-y-3">
                  {adminAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="p-3 rounded-lg bg-[#272727]">
                      <div className="font-semibold text-white">
                        {alert.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(alert.time).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rescue Requests */}
            <div className="p-6 bg-[#1e1e1e] rounded-xl">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">
                  Rescue Requests
                </h3>
                <div className="flex gap-4 mt-2">
                  <span className="text-sm text-red-200">
                    {pendingRescueCount} - pending
                  </span>
                  <span className="text-sm text-green-200">
                    {acknowlegdedRescueCount} - acknowledged
                  </span>
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-60 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0f0f0f] [&::-webkit-scrollbar-track]:rounded-full">
                {rescueRequests.length > 0 ? (
                  rescueRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className={`p-3 rounded-lg text-sm w-full max-w-[58vh] mx-auto ${
                        request.status === "pending"
                          ? "bg-red-900/50"
                          : "bg-[#272727]"
                      }`}
                    >
                      <div className="font-medium text-white">
                        {request.reason
                          ?.toString()
                          .replace(/_/g, " ")
                          .toUpperCase() || "EMERGENCY"}
                      </div>
                      <div className="text-xs text-gray-300">
                        {request.latitude?.toFixed(2)}°N,{" "}
                        {request.longitude?.toFixed(2)}°E
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(request.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400">
                    No rescue requests
                  </div>
                )}
              </div>
            </div>

            {/* Safety Index */}
            <div className="p-6 bg-[#1e1e1e] rounded-xl">
              <h3 className="mb-4 text-lg font-bold text-white">
                Safety Index
              </h3>
              <div className="text-center">
                <div className="mb-4 text-3xl font-bold text-white">
                  {safetyIndex?.score || "--"}/10
                </div>
                <div className="w-full h-3 mb-2 bg-gray-700 rounded-full">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-green-500 to-yellow-500"
                    style={{ width: `${(safetyIndex?.score || 0) * 10}%` }}
                  ></div>
                </div>
                <div className="mb-4 text-sm text-gray-400">
                  {safetyIndex?.level || "Loading..."}
                </div>
                {advisory.severity !== "unknown" && (
                  <div
                    className={`p-3 rounded-lg text-xs ${
                      advisory.severity === "danger"
                        ? "bg-red-900/30 text-red-200 border border-red-700/40"
                        : advisory.severity === "caution"
                        ? "bg-amber-900/30 text-amber-200 border border-amber-700/40"
                        : "bg-green-900/30 text-green-200 border border-green-700/40"
                    }`}
                  >
                    {advisory.severity === "danger" && "⚠️ "}
                    {advisory.severity === "caution" && "⚠️ "}
                    {advisory.severity === "ok" && "✅ "}
                    {advisory.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
