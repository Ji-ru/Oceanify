import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import supabase from "../../supabaseClient";

export default function EmergencyRescue() {
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [reason, setReason] = useState("");
  const [rescueActive, setRescueActive] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  // Get user's current location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        fetchWeatherData(latitude, longitude);
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch current weather conditions
  const fetchWeatherData = async (lat, lng) => {
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code&timezone=auto`;
      const waveUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height&timezone=auto`;

      const [weatherRes, waveRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(waveUrl),
      ]);

      const weather = weatherRes.ok ? await weatherRes.json() : null;
      const wave = waveRes.ok ? await waveRes.json() : null;

      setWeatherData({
        weather: weather?.current,
        wave: wave?.current,
      });
    } catch (err) {
      console.error("Failed to fetch weather data:", err);
    }
  };

  // Countdown timer for auto-send
  useEffect(() => {
    if (showConfirm && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showConfirm && countdown === 0) {
      handleConfirmRescue();
    }
  }, [showConfirm, countdown]);

  // Initiate rescue request
  const handleRequestRescue = () => {
    if (!reason.trim()) {
      alert("Please select a reason for the rescue request");
      return;
    }
    setShowConfirm(true);
    setCountdown(10);
  };

  // Confirm and send rescue request to Supabase
  const handleConfirmRescue = async () => {
    if (!userLocation) {
      alert("Location not available");
      return;
    }

    setShowConfirm(false);
    setRescueActive(true);

    try {
      const emergencyData = {
        timestamp: new Date().toISOString(),
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        reason: reason || "emergency_distress",
        weather: weatherData?.weather || {},
        marine: weatherData?.wave || {},
        status: "pending",
        read: false,
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from("rescue_requests")
        .insert([emergencyData])
        .select();

      if (error) {
        throw error;
      }

      console.log("Rescue request saved:", data);

      alert(
        "🆘 Emergency rescue request sent successfully! Coast Guard has been notified."
      );

      // Reset form
      setReason("");
      setTimeout(() => setRescueActive(false), 3000);
    } catch (err) {
      console.error("Rescue request failed:", err);
      alert("Failed to send rescue request. Please try again.");
      setRescueActive(false);
    }
  };

  // Cancel rescue request
  const handleCancelRescue = () => {
    setShowConfirm(false);
    setCountdown(10);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />

      <div className="max-w-6xl px-4 pt-24 pb-12 mx-auto">
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl animate-pulse">🆘</div>
          <h1 className="mb-3 text-4xl font-bold text-white">
            Emergency Rescue Request
          </h1>
          <p className="text-lg text-gray-400">
            Use this page in case of emergency situations at sea
          </p>
        </div>

        {loadingLocation ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-red-500 rounded-full animate-spin"></div>
              <p className="text-white">Getting your location...</p>
            </div>
          </div>
        ) : !userLocation ? (
          <div className="p-8 text-center border bg-red-900/20 border-red-500/30 rounded-2xl">
            <div className="mb-4 text-5xl">⚠️</div>
            <h3 className="mb-2 text-xl font-bold text-white">
              Location Access Required
            </h3>
            <p className="text-gray-300">
              Please enable location services to use emergency rescue features
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Location Card */}
            <div className="p-6 border bg-gradient-to-br from-white/10 to-white/5 border-white/20 rounded-2xl backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-semibold text-white">
                📍 Your Current Location
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="mb-1 text-sm text-gray-400">Latitude</div>
                  <div className="text-xl font-bold text-white">
                    {userLocation.latitude.toFixed(4)}°N
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="mb-1 text-sm text-gray-400">Longitude</div>
                  <div className="text-xl font-bold text-white">
                    {userLocation.longitude.toFixed(4)}°E
                  </div>
                </div>
              </div>
            </div>

            {/* Current Conditions */}
            {weatherData && (
              <div className="p-6 border bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 rounded-2xl backdrop-blur-xl">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  🌊 Current Conditions at Your Location
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="p-3 text-center rounded-lg bg-white/5">
                    <div className="mb-1 text-sm text-gray-400">
                      Temperature
                    </div>
                    <div className="text-lg font-bold text-white">
                      {weatherData.weather?.temperature_2m
                        ? `${Math.round(weatherData.weather.temperature_2m)}°C`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="p-3 text-center rounded-lg bg-white/5">
                    <div className="mb-1 text-sm text-gray-400">Wind Speed</div>
                    <div className="text-lg font-bold text-white">
                      {weatherData.weather?.wind_speed_10m
                        ? `${Math.round(
                            weatherData.weather.wind_speed_10m
                          )} km/h`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="p-3 text-center rounded-lg bg-white/5">
                    <div className="mb-1 text-sm text-gray-400">
                      Wave Height
                    </div>
                    <div className="text-lg font-bold text-white">
                      {weatherData.wave?.wave_height
                        ? `${weatherData.wave.wave_height.toFixed(1)} m`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="p-3 text-center rounded-lg bg-white/5">
                    <div className="mb-1 text-sm text-gray-400">
                      Precipitation
                    </div>
                    <div className="text-lg font-bold text-white">
                      {weatherData.weather?.precipitation
                        ? `${weatherData.weather.precipitation} mm`
                        : "0 mm"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Two Column Layout for Rescue Options */}
            <div className="grid gap-4 gird-cols-1 lg:grid-cols-2 md:gap-6">
              {/* QUICK RESCUE - Instant Emergency Button */}
              <div className="p-6 border-4 border-red-500 bg-gradient-to-br from-red-900/40 to-orange-900/30 rounded-2xl backdrop-blur-xl animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                      <span className="text-2xl">⚡</span>
                      Quick Rescue
                    </h3>
                    <p className="text-sm text-red-200">
                      Instant SOS - No form required
                    </p>
                  </div>
                  <div className="relative flex w-4 h-4">
                    <span className="absolute inline-flex w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></span>
                    <span className="relative inline-flex w-4 h-4 bg-red-600 rounded-full"></span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setReason("emergency_distress");
                    setShowConfirm(true);
                    setCountdown(10);
                  }}
                  disabled={rescueActive}
                  className={`w-full py-5 text-xl font-black text-white transition-all duration-200 rounded-xl shadow-2xl ${
                    rescueActive
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:scale-[1.05] active:scale-[0.95] hover:shadow-red-500/60 animate-pulse"
                  }`}
                >
                  {rescueActive ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      Sending Request...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-3xl animate-bounce">🆘</span>
                      <span>SEND IMMEDIATE SOS</span>
                    </span>
                  )}
                </button>

                <p className="mt-3 text-xs text-center text-red-300">
                  Click to send instant emergency alert with your location
                </p>
              </div>

              {/* Custom Rescue Request Form */}
              <div className="p-6 border bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 rounded-2xl backdrop-blur-xl">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  📝 Custom Rescue Request
                </h3>
                <p className="mb-4 text-sm text-gray-400">
                  Provide specific details about your emergency
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">
                      Reason for Rescue Request *
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-3 text-white border rounded-lg bg-[#1e1e1e] border-white/20 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select a reason</option>
                      <option value="sinking">Vessel Sinking</option>
                      <option value="engine_failure">Engine Failure</option>
                      <option value="medical_emergency">
                        Medical Emergency
                      </option>
                      <option value="fire">Fire Onboard</option>
                      <option value="collision">Collision</option>
                      <option value="man_overboard">Man Overboard</option>
                      <option value="severe_weather">Severe Weather</option>
                      <option value="other">Other Emergency</option>
                    </select>
                  </div>

                  <div className="p-4 border rounded-lg border-yellow-500/30 bg-yellow-900/20">
                    <p className="text-sm text-yellow-200">
                      ⚠️ <strong>Important:</strong> This will send an emergency
                      alert to rescue services with your current location and
                      conditions. Only use in genuine emergency situations.
                    </p>
                  </div>

                  <button
                    onClick={handleRequestRescue}
                    disabled={rescueActive || !reason}
                    className={`w-full py-4 text-lg font-bold text-white transition-all duration-200 rounded-xl ${
                      rescueActive || !reason
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-br from-blue-600 to-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                    }`}
                  >
                    {rescueActive ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        Sending Request...
                      </span>
                    ) : (
                      "📋 SEND DETAILED RESCUE REQUEST"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Safety Information */}
            <div className="p-6 border bg-gradient-to-br from-white/5 to-white/0 border-white/10 rounded-2xl backdrop-blur-xl">
              <h3 className="mb-3 text-lg font-semibold text-white">
                🛟 Safety Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>
                    Stay calm and ensure all crew members are wearing life
                    jackets
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Keep your phone charged and accessible</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>
                    If possible, activate emergency beacons (EPIRB/PLB)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>
                    Stay with your vessel unless it's sinking or on fire
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>
                    Prepare signal flares and make yourself visible to rescuers
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>
                    Monitor VHF radio on Channel 16 for rescue communications
                  </span>
                </li>
              </ul>
            </div>

            {/* Emergency Contact Info */}
            <div className="p-6 border bg-gradient-to-br from-orange-900/20 to-red-900/10 border-orange-500/30 rounded-2xl backdrop-blur-xl">
              <h3 className="mb-3 text-lg font-semibold text-white">
                📞 Emergency Contacts
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <div className="font-semibold text-white">Coast Guard</div>
                    <div className="text-sm text-gray-400">
                      24/7 Emergency Line
                    </div>
                  </div>
                  <div className="text-lg font-bold text-red-400">911</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <div className="font-semibold text-white">
                      Marine Rescue
                    </div>
                    <div className="text-sm text-gray-400">VHF Radio</div>
                  </div>
                  <div className="text-lg font-bold text-blue-400">
                    Channel 16
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-7 border-4 border-red-500 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-[0_24px_80px_rgba(239,68,68,0.25)] animate-in zoom-in duration-300">
            <div className="mb-6 text-center">
              <div className="mb-3 text-7xl animate-pulse">🆘</div>
              <h2 className="mb-2 text-2xl font-bold text-white">
                CONFIRM EMERGENCY RESCUE
              </h2>
              <p className="text-sm text-gray-400">
                Auto-sending in{" "}
                <span className="text-xl font-bold text-red-400">
                  {countdown}
                </span>{" "}
                second{countdown !== 1 ? "s" : ""}...
              </p>
            </div>

            <div className="p-4 mb-6 text-white border rounded-lg bg-white/5 border-white/20">
              <div className="mb-3">
                <p className="mb-1 text-xs text-gray-400">LOCATION</p>
                <p className="font-mono text-sm">
                  📍 {userLocation?.latitude.toFixed(4)}°N,{" "}
                  {userLocation?.longitude.toFixed(4)}°E
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-400">EMERGENCY TYPE</p>
                <p className="text-sm font-semibold text-red-400">
                  {reason.replace(/_/g, " ").toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmRescue}
                className="flex-1 py-4 font-bold text-white transition-all duration-200 rounded-lg shadow-xl bg-gradient-to-br from-red-500 to-red-600 hover:scale-105 active:scale-95"
              >
                ⚡ SEND NOW
              </button>
              <button
                onClick={handleCancelRescue}
                className="flex-1 py-4 font-bold text-white transition-all duration-200 bg-gray-600 rounded-lg hover:scale-105 active:scale-95"
              >
                ✕ CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
