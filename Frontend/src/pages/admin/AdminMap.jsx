import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMapInitialization } from "../../hooks/useMapInitialization";
import { useWeatherData } from "../../hooks/useWeatherData";
import { useRescueFlow } from "../../hooks/useRescueFlow";
import { useAlerts } from "../../hooks/useAlerts";
import { usePortMarkers } from "../../hooks/usePortMarkers";
import ControlPanel from "../../components/MapComponents/ControlPanel";
import AlertsPanel from "../../components/MapComponents/AlertsPanel";
import ForecastPanel from "../../components/MapComponents/ForecastPanel";
import ControlToggleButton from "../../components/MapComponents/ControlToggleButton";
import RescueModal from "../../components/MapComponents/RescueModal";
import Navbar from "../../components/Navbar";
import MarineVisualizer from "../../marineVisualizer/MarineVisualizer";
import { createEnhancedPopup } from "../../components/PopupContent";
import { createWavePopup } from "../../utils/mapUtils";
import { formatValue, degToCompass, getWeatherDescription } from "../../utils/weatherUtils";

export default function AdminMaps() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const warningMarkersRef = useRef([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [showStorm, setShowStorm] = useState(false);
  const [showForecastPanel, setShowForecastPanel] = useState(false);
  const [showControlsPanel, setShowControlsPanel] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  
  const navigate = useNavigate();

  // Custom hooks
  const { 
    currentLocation, 
    setCurrentLocation,
    forecastData, 
    setForecastData,
    loading, 
    loadingType,
    fetchLocationData,
    getWeatherIcon 
  } = useWeatherData();
  
  const { alerts } = useAlerts();
  const { showPorts, togglePortMarkers } = usePortMarkers(mapRef, mapLoaded);
  
  const rescueFlow = useRescueFlow(mapRef);

  // Initialize map
  useMapInitialization(
    mapRef, 
    markerRef, 
    warningMarkersRef, 
    setMapLoaded, 
    setShowForecastPanel,
    rescueFlow.requestRescueAt
  );

  // Set global functions for map interactions
  const setupGlobalFunctions = () => {
    window.selectDataType = async (lat, lng, dataType) => {
      await handleLocationDataFetch(lat, lng, "Selected Location", dataType);
    };

    window.viewWeatherData = async (lat, lng, locationName) => {
      await handleLocationDataFetch(lat, lng, locationName, "weather");
    };

    window.viewWaveData = async (lat, lng, locationName) => {
      await handleLocationDataFetch(lat, lng, locationName, "waves");
    };

    window.closePopup = () => {
      if (markerRef.current) {
        markerRef.current.closePopup();
      }
    };
  };

  // Handle location data fetching
  const handleLocationDataFetch = async (lat, lng, locationName, dataType) => {
    rescueFlow.setSelectedLat(lat);
    rescueFlow.setSelectedLng(lng);

    const data = await fetchLocationData(lat, lng, dataType);
    
    if (!data || !mapRef.current) return;

    // Remove previous marker
    if (markerRef.current && mapRef.current.hasLayer(markerRef.current)) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    const L = window.L;
    if (!L) return;

    if (dataType === "weather" && data.current) {
      const popupContent = createEnhancedPopup(
        data,
        null, // waveData would need to be fetched separately if needed
        lat,
        lng,
        getWeatherDescription,
        degToCompass,
        formatValue
      );

      const weatherIcon = L.divIcon({
        html: `<div style="background: linear-gradient(135deg, #ff6b6b, #ee5a52); color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.3);">${
          data.current.temperature_2m != null
            ? Math.round(data.current.temperature_2m) + "°"
            : "?"
        }</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      markerRef.current = L.marker([lat, lng], { icon: weatherIcon })
        .addTo(mapRef.current)
        .bindPopup(popupContent, {
          maxWidth: 400,
          className: "weather-popup",
        })
        .openPopup();
    } else if (dataType === "waves" && data.current) {
      const wavePopupContent = createWavePopup(data, lat, lng, locationName);

      const waveIcon = L.divIcon({
        html: `<div style="background: linear-gradient(135deg, #74b9ff, #0984e3); color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.3);">${
          data.current.wave_height != null
            ? data.current.wave_height.toFixed(1) + "m"
            : "🌊"
        }</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      markerRef.current = L.marker([lat, lng], { icon: waveIcon })
        .addTo(mapRef.current)
        .bindPopup(wavePopupContent, {
          maxWidth: 320,
          className: "wave-popup",
        })
        .openPopup();
    }

    // Center map on selected location
    mapRef.current.setView([lat, lng], 10);
  };

  // Setup global functions on component mount
  useState(() => {
    setupGlobalFunctions();
  }, []);

  // Layer toggle function
  const toggleLayer = (layerName, currentState, setState) => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const layer = map[layerName];
    if (currentState) {
      if (map.hasLayer(layer)) map.removeLayer(layer);
      setState(false);
    } else {
      layer?.addTo(map);
      setState(true);
    }
  };

  // Toggle panels
  const toggleControlsPanel = () => {
    setShowControlsPanel(!showControlsPanel);
    if (!showControlsPanel) {
      setShowAlertsPanel(false);
    }
  };

  const toggleAlertsPanel = () => {
    setShowAlertsPanel(!showAlertsPanel);
    if (!showAlertsPanel) {
      setShowControlsPanel(false);
    }
  };

  const selectedLocation = rescueFlow.selectedLat !== null ? {
    lat: rescueFlow.selectedLat,
    lng: rescueFlow.selectedLng
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0C0623] to-slate-800">
      {/* Navbar */}
      <Navbar />

      {/* Map */}
      <div id="map" className="absolute inset-0 z-0" />

      <MarineVisualizer lat={rescueFlow.selectedLat} lng={rescueFlow.selectedLng} />

      {/* Toggle Buttons */}
      <ControlToggleButton
        showControlsPanel={showControlsPanel}
        showAlertsPanel={showAlertsPanel}
        toggleControlsPanel={toggleControlsPanel}
        toggleAlertsPanel={toggleAlertsPanel}
        alertsCount={alerts.length}
      />

      {/* Control Panel */}
      <ControlPanel
        visible={showControlsPanel}
        onClose={() => setShowControlsPanel(false)}
        showTemperature={showTemperature}
        showPressure={showPressure}
        showStorm={showStorm}
        showPorts={showPorts}
        onToggleTemperature={() => toggleLayer("tempLayer", showTemperature, setShowTemperature)}
        onTogglePressure={() => toggleLayer("pressureLayer", showPressure, setShowPressure)}
        onToggleStorm={() => toggleLayer("precipitationLayer", showStorm, setShowStorm)}
        onTogglePorts={togglePortMarkers}
        onLogout={() => navigate("/")}
      />

      {/* Alerts Panel */}
      <AlertsPanel
        visible={showAlertsPanel}
        onClose={() => setShowAlertsPanel(false)}
        alerts={alerts}
      />

      {/* Forecast Panel */}
      <ForecastPanel
        visible={showForecastPanel}
        onClose={() => setShowForecastPanel(false)}
        forecastData={forecastData}
        currentLocation={currentLocation}
        selectedLocation={selectedLocation}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-4 p-6 border border-white/20 bg-white/10 rounded-2xl backdrop-blur-2xl">
            <div className="w-8 h-8 border-b-2 border-white rounded-full animate-spin"></div>
            <div className="text-lg text-white">Loading Weather Details...</div>
          </div>
        </div>
      )}

      {/* Rescue Modal */}
      <RescueModal {...rescueFlow} />
    </div>
  );
}