// React core
import { useEffect, useState, useMemo } from "react";
// Components
import Navbar from "../../components/Navbar";
// Ports data
import mindanaoPorts from "../../data/ports.json";
// Data clients
import supabase from "../../supabaseClient";
import API from "../../api";
// Weather hook (provides cached fetch)
import { useWeatherData } from "../../hooks/useWeatherForecastingData";
// Lucid React Icons
import {
  Thermometer,
  Wind,
  Waves,
  Compass,
  Droplets,
  Cloud,
  Gauge,
  Eye,
  Sun,
  Moon,
  AlertTriangle,
  Bell,
  MapPin,
  Anchor,
  Ship,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Coordinate Formatter
import { useFormattedCoordinates } from "../../hooks/useFormattedCoords";

// Caching in Local Storage
import { useLocalStorage } from "../../hooks/useLocalStorage";
import {
  SEVERITY,
  getSeverityConfig,
} from "../../services/weatherAlertService";

// Dashboard Components
import NotificationAlert from "../../components/DashboardComponents/NotificationAlert";

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
  const [showMobilePorts, setShowMobilePorts] = useState(false);

  // Add these two lines for marine alerts:
  const [expandedAlert, setExpandedAlert] = useState(false);
  const [selectedAlertTab, setSelectedAlertTab] = useState("overview");

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

  // Analyze ports conditions
  const getPortsAnalysis = useMemo(() => {
    if (!mindanaoPorts?.ports_of_mindanao) return [];

    return mindanaoPorts.ports_of_mindanao.slice(0, 5).map((port) => {
      // Simple analysis based on general conditions - in a real app you'd fetch actual data for each port
      let severity = SEVERITY.SAFE;
      let issues = [];

      // Mock analysis based on port location and general conditions
      if (
        port.port_name.includes("Davao") ||
        port.port_name.includes("General")
      ) {
        // Simulate some ports having issues
        if (weatherData?.current?.wind_speed_10m > 30) {
          severity = SEVERITY.CAUTION;
          issues.push("Moderate winds affecting operations");
        }
      }

      if (
        port.port_name.includes("Zamboanga") ||
        port.port_name.includes("Cotabato")
      ) {
        // Simulate some ports with warnings
        if (waveData?.current?.wave_height > 1.5) {
          severity = SEVERITY.WARNING;
          issues.push("High waves - exercise caution");
        }
      }

      return {
        ...port,
        severity,
        issues,
        status:
          severity === SEVERITY.SAFE
            ? "Operational"
            : severity === SEVERITY.CAUTION
            ? "Advisory"
            : severity === SEVERITY.WARNING
            ? "Caution"
            : "Closed",
      };
    });
  }, [weatherData, waveData]);
  // Analyze current conditions for fishing safety
  const getFishingSafety = useMemo(() => {
    if (!weatherData || !waveData)
      return { severity: SEVERITY.SAFE, recommendations: [] };

    const wind = weatherData.current?.wind_speed_10m ?? 0;
    const waves = waveData.current?.wave_height ?? 0;
    const weatherCode = weatherData.current?.weather_code ?? 0;

    let severity = SEVERITY.SAFE;
    const recommendations = [];

    // Danger conditions for small fishing boats
    if (waves >= 2.0 || wind >= 45 || [95, 96, 99].includes(weatherCode)) {
      severity = SEVERITY.DANGER;
      recommendations.push(
        "⛔ DO NOT SAIL - Conditions dangerous for small boats"
      );
      recommendations.push("Seek immediate shelter if at sea");
    }
    // Warning conditions
    else if (waves >= 1.5 || wind >= 35 || [82, 65].includes(weatherCode)) {
      severity = SEVERITY.WARNING;
      recommendations.push("⚠️ NOT RECOMMENDED - Hazardous for fishing");
      recommendations.push("Only experienced crews with proper equipment");
    }
    // Caution conditions
    else if (waves >= 1.0 || wind >= 25 || [63, 61, 53].includes(weatherCode)) {
      severity = SEVERITY.CAUTION;
      recommendations.push("⚠️ CAUTION ADVISED - Exercise care");
      recommendations.push("Stay close to shore and monitor weather");
    }
    // Safe conditions
    else {
      recommendations.push("✓ Generally safe for fishing");
      recommendations.push("Maintain standard safety precautions");
    }

    return { severity, recommendations: recommendations.slice(0, 3) };
  }, [weatherData, waveData]);

  // Analyze current conditions for commercial sailing
  const getCommercialSafety = useMemo(() => {
    if (!weatherData || !waveData)
      return { severity: SEVERITY.SAFE, recommendations: [] };

    const wind = weatherData.current?.wind_speed_10m ?? 0;
    const waves = waveData.current?.wave_height ?? 0;
    const gusts = weatherData.current?.wind_gusts_10m ?? 0;

    let severity = SEVERITY.SAFE;
    const recommendations = [];

    // Danger conditions for commercial vessels
    if (waves >= 4.0 || wind >= 60 || gusts >= 80) {
      severity = SEVERITY.DANGER;
      recommendations.push("⚠️ EXTREME CAUTION - Hazardous conditions");
      recommendations.push("Consider delaying departure if possible");
    }
    // Warning conditions
    else if (waves >= 2.5 || wind >= 45 || gusts >= 60) {
      severity = SEVERITY.WARNING;
      recommendations.push("⚠️ PROCEED WITH CAUTION - Challenging conditions");
      recommendations.push("Reduce speed and maintain safe distances");
    }
    // Caution conditions
    else if (waves >= 1.5 || wind >= 35) {
      severity = SEVERITY.CAUTION;
      recommendations.push("⚠️ MINOR CAUTION - Some challenging conditions");
      recommendations.push("Maintain normal safety protocols");
    }
    // Safe conditions
    else {
      recommendations.push("✓ Conditions favorable for sailing");
      recommendations.push("Maintain standard operational procedures");
    }

    return { severity, recommendations: recommendations.slice(0, 3) };
  }, [weatherData, waveData]);

  // Get overall severity for alerts header
  const overallSeverity = useMemo(() => {
    const fishingSeverity = getFishingSafety.severity;
    const commercialSeverity = getCommercialSafety.severity;

    if (
      fishingSeverity === SEVERITY.DANGER ||
      commercialSeverity === SEVERITY.DANGER
    ) {
      return SEVERITY.DANGER;
    }
    if (
      fishingSeverity === SEVERITY.WARNING ||
      commercialSeverity === SEVERITY.WARNING
    ) {
      return SEVERITY.WARNING;
    }
    if (
      fishingSeverity === SEVERITY.CAUTION ||
      commercialSeverity === SEVERITY.CAUTION
    ) {
      return SEVERITY.CAUTION;
    }
    return SEVERITY.SAFE;
  }, [getFishingSafety, getCommercialSafety]);

  const severityConfig = getSeverityConfig(overallSeverity);

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

  // Render compact marine alerts header
  const renderCompactAlertsHeader = () => (
    <div
      className="flex items-center justify-between p-3 cursor-pointer"
      onClick={() => setExpandedAlert(!expandedAlert)}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-6 h-6 text-xs border-2 rounded-full"
          style={{
            backgroundColor: severityConfig.bgColor,
            color: severityConfig.color,
            borderColor: severityConfig.borderColor,
          }}
        >
          {severityConfig.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              Marine Safety
            </span>
            <span
              className="px-2 py-0.5 text-xs font-bold rounded-full"
              style={{ backgroundColor: severityConfig.color, color: "white" }}
            >
              {severityConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Live conditions</span>
          </div>
        </div>
      </div>
      {expandedAlert ? (
        <ChevronUp className="w-4 h-4 text-white" />
      ) : (
        <ChevronDown className="w-4 h-4 text-white" />
      )}
    </div>
  );

  // Render expanded marine alerts content
  const renderExpandedAlertsContent = () => (
    <div className="p-3 border-t border-gray-700">
      {/* Tabs */}
      <div className="flex gap-1 p-1 mb-4 rounded-lg bg-[#272727]">
        {[
          { id: "overview", label: "Overview", icon: MapPin },
          { id: "fishing", label: "Fishing", icon: Anchor },
          { id: "commercial", label: "Commercial", icon: Ship },
          { id: "ports", label: "Ports", icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedAlertTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedAlertTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 flex-1 justify-center ${
                isActive
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {selectedAlertTab === "overview" && (
          <div className="space-y-3">
            {/* Current Location Summary */}
            <div className="p-3 rounded-lg bg-[#272727]">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-white">
                    {selectedPort ? selectedPort.port_name : "Your Location"}
                  </div>
                  <div className="text-xs text-gray-400">{formattedCoords}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-400">Weather</div>
                  <div className="font-medium text-white">
                    {weatherData
                      ? getWeatherDescription(weatherData.current.weather_code)
                      : "--"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Wind</div>
                  <div className="font-medium text-white">
                    {formatValue(
                      weatherData?.current?.wind_speed_10m,
                      " km/h",
                      0
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Waves</div>
                  <div className="font-medium text-white">
                    {formatValue(waveData?.current?.wave_height, " m", 1)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Swell</div>
                  <div className="font-medium text-white">
                    {formatValue(waveData?.current?.swell_wave_height, " m", 1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Safety Status */}
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`p-2 text-center rounded ${
                  getFishingSafety.severity === SEVERITY.DANGER
                    ? "border-red-500 bg-red-500/10"
                    : getFishingSafety.severity === SEVERITY.WARNING
                    ? "border-orange-500 bg-orange-500/10"
                    : getFishingSafety.severity === SEVERITY.CAUTION
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-green-500 bg-green-500/10"
                }`}
              >
                <div className="text-lg font-bold text-white">
                  {getFishingSafety.severity === SEVERITY.DANGER
                    ? "⛔"
                    : getFishingSafety.severity === SEVERITY.WARNING
                    ? "⚠️"
                    : getFishingSafety.severity === SEVERITY.CAUTION
                    ? "⚠️"
                    : "✓"}
                </div>
                <div className="text-xs text-gray-300">Fishing</div>
              </div>
              <div
                className={`p-2 text-center rounded ${
                  getCommercialSafety.severity === SEVERITY.DANGER
                    ? "border-red-500 bg-red-500/10"
                    : getCommercialSafety.severity === SEVERITY.WARNING
                    ? "border-orange-500 bg-orange-500/10"
                    : getCommercialSafety.severity === SEVERITY.CAUTION
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-green-500 bg-green-500/10"
                }`}
              >
                <div className="text-lg font-bold text-white">
                  {getCommercialSafety.severity === SEVERITY.DANGER
                    ? "⛔"
                    : getCommercialSafety.severity === SEVERITY.WARNING
                    ? "⚠️"
                    : getCommercialSafety.severity === SEVERITY.CAUTION
                    ? "⚠️"
                    : "✓"}
                </div>
                <div className="text-xs text-gray-300">Commercial</div>
              </div>
            </div>
          </div>
        )}

        {selectedAlertTab === "fishing" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Anchor className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">
                Fishing Vessels
              </h3>
            </div>

            <div
              className="p-3 border rounded-lg"
              style={{
                backgroundColor: getSeverityConfig(getFishingSafety.severity)
                  .bgColor,
                borderColor: getSeverityConfig(getFishingSafety.severity)
                  .borderColor,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {getSeverityConfig(getFishingSafety.severity).icon}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color: getSeverityConfig(getFishingSafety.severity).color,
                  }}
                >
                  {getSeverityConfig(getFishingSafety.severity).label}
                </span>
              </div>

              <ul className="space-y-1 text-xs">
                {getFishingSafety.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5"
                    style={{
                      color: getSeverityConfig(getFishingSafety.severity).color,
                    }}
                  >
                    <span>•</span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {selectedAlertTab === "commercial" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Ship className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">
                Commercial Vessels
              </h3>
            </div>

            <div
              className="p-3 border rounded-lg"
              style={{
                backgroundColor: getSeverityConfig(getCommercialSafety.severity)
                  .bgColor,
                borderColor: getSeverityConfig(getCommercialSafety.severity)
                  .borderColor,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {getSeverityConfig(getCommercialSafety.severity).icon}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color: getSeverityConfig(getCommercialSafety.severity)
                      .color,
                  }}
                >
                  {getSeverityConfig(getCommercialSafety.severity).label}
                </span>
              </div>

              <ul className="space-y-1 text-xs">
                {getCommercialSafety.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5"
                    style={{
                      color: getSeverityConfig(getCommercialSafety.severity)
                        .color,
                    }}
                  >
                    <span>•</span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {selectedAlertTab === "ports" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">
                Port Conditions
              </h3>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getPortsAnalysis.map((port, index) => {
                const portConfig = getSeverityConfig(port.severity);
                return (
                  <div
                    key={index}
                    className="p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] text-xs backdrop-blur-sm"
                    style={{
                      backgroundColor: portConfig.bgColor,
                      borderColor: portConfig.borderColor,
                    }}
                    onClick={() => handlePortChange(port)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="font-semibold truncate"
                        style={{ color: portConfig.color }}
                      >
                        {port.port_name}
                      </span>
                      <span className="flex-shrink-0 ml-1 text-lg">
                        {portConfig.icon}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span
                        style={{ color: portConfig.color }}
                        className="font-medium"
                      >
                        {port.status}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {port.location}
                      </span>
                    </div>
                    {port.issues.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {port.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <span style={{ color: portConfig.color }}>•</span>
                            <span
                              style={{ color: portConfig.color }}
                              className="text-xs leading-tight"
                            >
                              {issue}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {getPortsAnalysis.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-xs">
                  No port data available
                </div>
              )}
            </div>

            {/* Quick Ports Summary */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              <div className="p-2 text-center rounded bg-green-500/10 border border-green-500">
                <div className="text-lg font-bold text-green-400">
                  {
                    getPortsAnalysis.filter((p) => p.severity === SEVERITY.SAFE)
                      .length
                  }
                </div>
                <div className="text-xs text-green-300">Operational</div>
              </div>
              <div className="p-2 text-center rounded bg-yellow-500/10 border border-yellow-500">
                <div className="text-lg font-bold text-yellow-400">
                  {
                    getPortsAnalysis.filter(
                      (p) => p.severity === SEVERITY.CAUTION
                    ).length
                  }
                </div>
                <div className="text-xs text-yellow-300">Advisory</div>
              </div>
              <div className="p-2 text-center rounded bg-orange-500/10 border border-orange-500">
                <div className="text-lg font-bold text-orange-400">
                  {
                    getPortsAnalysis.filter(
                      (p) => p.severity === SEVERITY.WARNING
                    ).length
                  }
                </div>
                <div className="text-xs text-orange-300">Caution</div>
              </div>
              <div className="p-2 text-center rounded bg-red-500/10 border border-red-500">
                <div className="text-lg font-bold text-red-400">
                  {
                    getPortsAnalysis.filter(
                      (p) => p.severity === SEVERITY.DANGER
                    ).length
                  }
                </div>
                <div className="text-xs text-red-300">Danger</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

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

            {/* Mobile-optimized port selection */}
            <div className="flex items-center gap-4">
              {/* Desktop/Tablet Select */}
              <div className="hidden sm:block">
                <select
                  className="px-4 py-2 text-sm bg-[#1e1e1e] text-white rounded-lg hover:bg-[#272727] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
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
              </div>

              {/* Mobile Dropdown Button with Modal */}
              <div className="sm:hidden">
                <button
                  className="px-4 py-3 text-sm bg-[#1e1e1e] text-white rounded-lg w-40 text-left flex items-center justify-between"
                  onClick={() => setShowMobilePorts(!showMobilePorts)}
                >
                  <span className="truncate">
                    {selectedPort ? selectedPort.port_name : "Select Port"}
                  </span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
                </button>

                {/* Mobile Ports Modal */}
                {showMobilePorts && (
                  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] rounded-xl w-full max-w-sm max-h-[80vh] overflow-hidden">
                      <div className="p-4 flex justify-between items-center">
                        <h3 className="font-semibold text-white">
                          Select Port
                        </h3>
                        <button
                          onClick={() => setShowMobilePorts(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <button
                          className="w-full p-4 text-left hover:bg-[#272727] text-white"
                          onClick={() => {
                            setSelectedPort(null);
                            if (userLocation) {
                              loadByCoords(
                                userLocation.latitude,
                                userLocation.longitude
                              );
                            }
                            setShowMobilePorts(false);
                          }}
                        >
                          Current Location
                        </button>
                        {mindanaoPorts.ports_of_mindanao.map((port) => (
                          <button
                            key={port.port_name}
                            className="w-full p-4 text-left hover:bg-[#272727] text-white"
                            onClick={() => {
                              handlePortChange(port);
                              setShowMobilePorts(false);
                            }}
                          >
                            <div className="font-medium">{port.port_name}</div>
                            <div className="text-sm text-gray-400">
                              {port.location}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-3xl hover:bg-[#272727] text-white"
              >
                <Bell className="w-5 h-5" />
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
              <AlertTriangle className="inline w-4 h-4 mr-1" />
              {error}
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
                      <MapPin className="inline w-3 h-3 mr-1" />
                      {notification.latitude?.toFixed(4)}°N,{" "}
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
                  <Thermometer className="w-8 h-8 text-red-400" />
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
                  <Wind className="w-8 h-8 text-blue-400" />
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
                <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-white">
                  <Waves className="w-5 h-5 text-cyan-400" />
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
                      icon: <Compass className="w-4 h-4" />,
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
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {item.icon}
                        {item.label}
                      </div>
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
                      icon: <Droplets className="w-4 h-4 text-blue-300" />,
                    },
                    {
                      label: "Cloud Cover",
                      value: formatValue(
                        weatherData?.current?.cloud_cover,
                        "%",
                        0
                      ),
                      icon: <Cloud className="w-4 h-4 text-gray-300" />,
                    },
                    {
                      label: "Pressure",
                      value: formatValue(
                        weatherData?.current?.surface_pressure,
                        " hPa",
                        0
                      ),
                      icon: <Gauge className="w-4 h-4 text-purple-300" />,
                    },
                    {
                      label: "Visibility",
                      value:
                        weatherData?.current?.weather_code <= 3
                          ? "Good"
                          : "Reduced",
                      icon: <Eye className="w-4 h-4 text-green-300" />,
                    },
                    {
                      label: "Day/Night",
                      value: weatherData?.current?.is_day ? "Day" : "Night",
                      icon: weatherData?.current?.is_day ? (
                        <Sun className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-300" />
                      ),
                    },
                  ].map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-[#272727]">
                      <div className="flex items-center gap-2 mb-1">
                        {item.icon}
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
            {/* Enhanced Marine Alerts */}
            <div className="bg-[#1e1e1e] rounded-xl overflow-hidden">
              {renderCompactAlertsHeader()}
              {expandedAlert && renderExpandedAlertsContent()}
            </div>

            {/* Notification Alert Component */}
            <NotificationAlert adminAlerts={adminAlerts} autoRefresh={true} />
            {/* Rescue Requests */}
            <div className="p-6 bg-[#1e1e1e] rounded-xl">
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
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
                        <MapPin className="inline w-3 h-3 mr-1" />
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

            {/* Safety Index - Modern Gauge Design */}
            <div className="p-6 bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl border border-white/10 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Gauge className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Marine Safety Index
                    </h3>
                    <p className="text-sm text-gray-400">
                      Real-time conditions assessment
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Last Updated</div>
                  <div className="text-sm font-medium text-white">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Main Gauge Section */}
              <div className="relative mb-8">
                {/* Gauge Container */}
                <div className="relative w-full h-40 mb-2">
                  <svg viewBox="0 0 200 120" className="w-full h-full">
                    {/* Background Track */}
                    <path
                      d="M 25 100 A 75 75 0 0 1 175 100"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="16"
                      strokeLinecap="round"
                      opacity="0.3"
                    />

                    {/* Active Fill */}
                    <path
                      d="M 25 100 A 75 75 0 0 1 175 100"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray="235.5"
                      strokeDashoffset={
                        235.5 - ((safetyIndex?.score || 0) / 10) * 235.5
                      }
                      className="transition-all duration-1500 ease-out"
                    />

                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient
                        id="gaugeGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="25%" stopColor="#f59e0b" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="75%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>

                    {/* Needle */}
                    <g
                      transform={`rotate(${
                        -90 + (safetyIndex?.score || 0) * 18
                      } 100 100)`}
                      className="transition-transform duration-1500 ease-out"
                    >
                      <line
                        x1="100"
                        y1="100"
                        x2="100"
                        y2="30"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        filter="drop-shadow(0 0 2px rgba(255,255,255,0.5))"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="10"
                        fill="#1a1a1a"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <circle cx="100" cy="100" r="4" fill="white" />
                    </g>

                    {/* Danger Markers */}
                    {[0, 2, 4, 6, 8, 10].map((mark, index) => (
                      <g
                        key={mark}
                        transform={`rotate(${-90 + mark * 18} 100 100)`}
                      >
                        <line
                          x1="100"
                          y1="25"
                          x2="100"
                          y2={index % 2 === 0 ? "35" : "30"}
                          stroke="white"
                          strokeWidth={index % 2 === 0 ? "2" : "1"}
                          strokeOpacity="0.5"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Scale Labels */}
                  <div className="absolute inset-0 flex items-end justify-between px-6 pb-1">
                    {[0, 5, 10].map((label) => (
                      <div key={label} className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-400">
                          {label}
                        </span>
                        <div className="w-px h-2 bg-gray-600 mt-1"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center Score Display */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center -mt-8">
                    <div className="inline-flex flex-col items-center px-8 py-4 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl border border-white/20 shadow-2xl backdrop-blur-sm">
                      <div className="text-4xl font-black text-white mb-1">
                        {safetyIndex?.score || "--"}
                        <span className="text-lg font-semibold text-gray-400 ml-1">
                          /10
                        </span>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          (safetyIndex?.score || 0) >= 8
                            ? "bg-green-500/20 text-green-300"
                            : (safetyIndex?.score || 0) >= 6
                            ? "bg-blue-500/20 text-blue-300"
                            : (safetyIndex?.score || 0) >= 4
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {safetyIndex?.level || "Loading..."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditions Breakdown */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                  CONDITIONS BREAKDOWN
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      key: "wind",
                      icon: Wind,
                      color: "text-blue-400",
                      bgColor: "bg-blue-500/20",
                      label: "Wind",
                    },
                    {
                      key: "waves",
                      icon: Waves,
                      color: "text-cyan-400",
                      bgColor: "bg-cyan-500/20",
                      label: "Waves",
                    },
                    {
                      key: "weather",
                      icon: Cloud,
                      color: "text-gray-400",
                      bgColor: "bg-gray-500/20",
                      label: "Weather",
                    },
                  ].map(
                    ({ key, icon: Icon, color, bgColor, label }) =>
                      safetyIndex?.details?.[key] && (
                        <div
                          key={key}
                          className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${bgColor}`}>
                              <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                              {label}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-white">
                              {Math.round(safetyIndex.details[key].score)}%
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              {safetyIndex.details[key].level}
                            </div>
                          </div>
                        </div>
                      )
                  )}
                </div>
              </div>

              {/* Advisory Section */}
              {advisory.severity !== "unknown" && (
                <div className="mb-6">
                  <div
                    className={`p-4 rounded-xl border-l-4 backdrop-blur-sm ${
                      advisory.severity === "danger"
                        ? "bg-gradient-to-r from-red-900/30 to-red-800/10 border-l-red-500"
                        : advisory.severity === "caution"
                        ? "bg-gradient-to-r from-amber-900/30 to-amber-800/10 border-l-amber-500"
                        : "bg-gradient-to-r from-green-900/30 to-green-800/10 border-l-green-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          advisory.severity === "danger"
                            ? "bg-red-500/20"
                            : advisory.severity === "caution"
                            ? "bg-amber-500/20"
                            : "bg-green-500/20"
                        }`}
                      >
                        {advisory.severity === "danger" && (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        )}
                        {advisory.severity === "caution" && (
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        )}
                        {advisory.severity === "ok" && (
                          <div className="w-5 h-5 text-green-400">✓</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`text-sm font-bold mb-1 ${
                            advisory.severity === "danger"
                              ? "text-red-300"
                              : advisory.severity === "caution"
                              ? "text-amber-300"
                              : "text-green-300"
                          }`}
                        >
                          {advisory.severity === "danger" &&
                            "DO NOT SAIL - CONDITIONS DANGEROUS"}
                          {advisory.severity === "caution" &&
                            "EXERCISE CAUTION - MODERATE RISK"}
                          {advisory.severity === "ok" &&
                            "SAFE TO SAIL - FAVORABLE CONDITIONS"}
                        </div>
                        <p
                          className={`text-sm leading-relaxed ${
                            advisory.severity === "danger"
                              ? "text-red-200"
                              : advisory.severity === "caution"
                              ? "text-amber-200"
                              : "text-green-200"
                          }`}
                        >
                          {advisory.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Safety */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                  ACTIVITY SAFETY
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      type: "fishing",
                      icon: Anchor,
                      label: "Fishing",
                      safety: getFishingSafety,
                      safeColors:
                        "from-green-500/20 to-green-600/10 border-green-500/30",
                      dangerColors:
                        "from-red-500/20 to-red-600/10 border-red-500/30",
                    },
                    {
                      type: "commercial",
                      icon: Ship,
                      label: "Commercial",
                      safety: getCommercialSafety,
                      safeColors:
                        "from-blue-500/20 to-blue-600/10 border-blue-500/30",
                      dangerColors:
                        "from-red-500/20 to-red-600/10 border-red-500/30",
                    },
                  ].map(
                    ({
                      type,
                      icon: Icon,
                      label,
                      safety,
                      safeColors,
                      dangerColors,
                    }) => (
                      <div
                        key={type}
                        className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                          safety.severity === SEVERITY.SAFE ||
                          safety.severity === SEVERITY.CAUTION
                            ? safeColors
                            : dangerColors
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-5 h-5 ${
                              safety.severity === SEVERITY.SAFE ||
                              safety.severity === SEVERITY.CAUTION
                                ? type === "fishing"
                                  ? "text-green-400"
                                  : "text-blue-400"
                                : "text-red-400"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-white">
                              {label}
                            </div>
                            <div
                              className={`text-xs font-medium ${
                                safety.severity === SEVERITY.SAFE ||
                                safety.severity === SEVERITY.CAUTION
                                  ? type === "fishing"
                                    ? "text-green-300"
                                    : "text-blue-300"
                                  : "text-red-300"
                              }`}
                            >
                              {safety.severity === SEVERITY.SAFE
                                ? "Good"
                                : safety.severity === SEVERITY.CAUTION
                                ? "Careful"
                                : safety.severity === SEVERITY.WARNING
                                ? "Risky"
                                : "Dangerous"}
                            </div>
                          </div>
                          <div
                            className={`text-lg ${
                              safety.severity === SEVERITY.SAFE ||
                              safety.severity === SEVERITY.CAUTION
                                ? type === "fishing"
                                  ? "text-green-400"
                                  : "text-blue-400"
                                : "text-red-400"
                            }`}
                          >
                            {safety.severity === SEVERITY.SAFE
                              ? "✓"
                              : safety.severity === SEVERITY.CAUTION
                              ? "⚠"
                              : safety.severity === SEVERITY.WARNING
                              ? "⚠"
                              : "⛔"}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
