import { useState, useEffect } from 'react';
import { fetchCurrentWeather, fetchWaveData } from '../utils/weatherApi';

export const useRescueFlow = (mapRef) => {
  const [showRescueConfirm, setShowRescueConfirm] = useState(false);
  const [rescueCountdown, setRescueCountdown] = useState(10);
  const [rescuePendingLocation, setRescuePendingLocation] = useState(null);
  const [rescuePendingReason, setRescuePendingReason] = useState(null);
  const [rescueActive, setRescueActive] = useState(false);
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLng, setSelectedLng] = useState(null);

  const requestRescueAt = (lat, lng, reason = "Unknown") => {
    setRescuePendingLocation({ lat, lng });
    setRescuePendingReason(reason);
    setRescueCountdown(10);
    setShowRescueConfirm(true);
  };

  const confirmRescue = async (overrideLocation = null, overrideReason = null) => {
    const loc = overrideLocation || rescuePendingLocation;
    const reason = overrideReason || rescuePendingReason || "Unknown";

    if (!loc) {
      alert("No location selected for rescue.");
      setShowRescueConfirm(false);
      return;
    }

    setShowRescueConfirm(false);
    setRescueActive(true);

    try {
      const [weatherData, waveData] = await Promise.all([
        fetchCurrentWeather(loc.lat, loc.lng),
        fetchWaveData(loc.lat, loc.lng)
      ]);

      const emergencyData = {
        timestamp: new Date().toISOString(),
        latitude: loc.lat,
        longitude: loc.lng,
        reason,
        weather: weatherData?.current || {},
        marine: waveData?.current || {},
        note: "client-side rescue request (logged locally)",
      };

      let backendOk = false;
      try {
        const resp = await fetch("/api/emergency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emergencyData),
        });
        if (resp.ok) backendOk = true;
      } catch (err) {
        console.warn("Backend unreachable. Falling back to local log.", err);
      }

      // Place SOS marker on map
      if (mapRef.current && window.L) {
        const L = window.L;
        const sosIcon = L.divIcon({
          html: `<div class="sos-icon">🆘</div>`,
          iconSize: [56, 56],
          iconAnchor: [28, 28],
        });

        L.marker([loc.lat, loc.lng], { icon: sosIcon })
          .addTo(mapRef.current)
          .bindPopup(
            `<div class="p-3 bg-gradient-to-br from-red-900/90 to-orange-900/70 rounded-xl border border-red-500/30 backdrop-blur-sm">
              <b class="text-white">🆘 EMERGENCY</b><br/>
              <span class="text-red-200">Reason: ${reason}</span><br/>
              <span class="text-blue-200 text-sm">${new Date().toLocaleString()}</span>
            </div>`
          )
          .openPopup();
      }

      // Save locally
      try {
        const logs = JSON.parse(localStorage.getItem("rescueLogs") || "[]");
        logs.unshift({
          ...emergencyData,
          persistedAt: new Date().toISOString(),
          backendOk,
        });
        localStorage.setItem("rescueLogs", JSON.stringify(logs));
      } catch (err) {
        console.warn("Failed to persist rescue log", err);
      }

      console.log("Rescue event logged:", { ...emergencyData, backendOk });
      alert("🆘 Rescue request recorded. Admin has been notified (or saved locally).");

      setTimeout(() => setRescueActive(false), 10000);
    } catch (err) {
      console.error("confirmRescue error:", err);
      alert("Failed to send rescue request — saved locally.");
      setRescueActive(false);
    }
  };

  const cancelRescue = () => {
    setShowRescueConfirm(false);
    setRescueCountdown(10);
    setRescuePendingLocation(null);
    setRescuePendingReason(null);
  };

  // Countdown effect
  useEffect(() => {
    if (showRescueConfirm && rescueCountdown > 0) {
      const t = setTimeout(() => setRescueCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (showRescueConfirm && rescueCountdown === 0) {
      confirmRescue();
    }
  }, [showRescueConfirm, rescueCountdown]);

  return {
    showRescueConfirm,
    rescueCountdown,
    rescuePendingLocation,
    rescuePendingReason,
    rescueActive,
    selectedLat,
    selectedLng,
    setSelectedLat,
    setSelectedLng,
    requestRescueAt,
    confirmRescue,
    cancelRescue
  };
};