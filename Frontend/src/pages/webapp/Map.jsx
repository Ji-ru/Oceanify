import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMapInitialization } from "../../hooks/useMapInitialization";
import { useWeatherData } from "../../hooks/useWeatherForecastingData";
import { useRescueFlow } from "../../hooks/useRescueFlow";
import { useAlerts } from "../../hooks/useAlerts";
import { usePortMarkers } from "../../hooks/usePortMarkers";
import { createWeatherPopup, createWavePopup } from "../../utils/mapUtils";
import ControlPanel from "../../components/MapComponents/ControlPanel";
import AlertsPanel from "../../components/MapComponents/AlertsPanel";
import ForecastPanel from "../../components/MapComponents/ForecastPanel";
import ControlToggleButton from "../../components/MapComponents/ControlToggleButton";
import RescueModal from "../../components/MapComponents/RescueModal";
import Navbar from "../../components/Navbar";
import MarineVisualizer from "../../marineVisualizer/MarineVisualizer";
import AdminEmergencyMarkers from "../../components/MapComponents/AdminEmergencyMarkers";
import WeatherNotificationPanel from "../../components/MapComponents/WeatherNotificationPanel";
import { useWeatherAlerts } from "../../hooks/useWeatherAlerts";

export default function Maps() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [showStorm, setShowStorm] = useState(false);
  const [showForecastPanel, setShowForecastPanel] = useState(false);
  const [showControlsPanel, setShowControlsPanel] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [showWeatherNotification, setShowWeatherNotification] = useState(false); // Add this state
  const [activePanel, setActivePanel] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const navigate = useNavigate();

  // Custom hooks
  const {
    currentLocation,
    setCurrentLocation,
    forecastData,
    setForecastData,
    loading,
    fetchLocationData,
  } = useWeatherData();

  const { alerts } = useAlerts();
  const { showPorts, togglePortMarkers } = usePortMarkers(mapRef, mapLoaded);

  const rescueFlow = useRescueFlow(mapRef);

  // Initialize map
  useMapInitialization(
    mapRef,
    markerRef,
    setMapLoaded,
    setShowForecastPanel,
    rescueFlow.requestRescueAt,
    userLocation,
    setUserLocation
  );

  // Use the weather alerts hook
  const { alertSummary, loading: alertsLoading } = useWeatherAlerts({
    updateInterval: 30 * 60 * 1000,
    monitorPorts: true,
    monitorUserLocation: true,
  });

  // Calculate total maritime alerts count
  const maritimeAlertsCount = useMemo(() => {
    if (!alertSummary) return 0;

    // Simply sum danger, warning, and caution alerts
    return (
      (alertSummary.danger || 0) +
      (alertSummary.warning || 0) +
      (alertSummary.caution || 0)
    );
  }, [alertSummary]);

  // Handle panel visibility
  useEffect(() => {
    if (showControlsPanel) setActivePanel("controls");
    else if (showAlertsPanel) setActivePanel("alerts");
    else if (showForecastPanel) setActivePanel("forecast");
    else if (showWeatherNotification)
      setActivePanel("weather-notification"); // Add this
    else setActivePanel(null);
  }, [
    showControlsPanel,
    showAlertsPanel,
    showForecastPanel,
    showWeatherNotification,
  ]); // Add dependency

  // Handle location data fetching - wrap in useCallback to prevent infinite re-renders
  // Handle location data fetching - FIXED VERSION
  const handleLocationDataFetch = useCallback(
    async (lat, lng, locationName, dataType) => {
      if (!lat || !lng) return;

      // DON'T close the panel immediately - this causes the flicker
      // setShowForecastPanel(false);

      rescueFlow.setSelectedLat(lat);
      rescueFlow.setSelectedLng(lng);

      // Fetch data via cached hook
      const data = await fetchLocationData(lat, lng, dataType);

      // Set context for forecast panel
      setCurrentLocation({
        lat,
        lng,
        name: locationName || "Selected Location",
      });

      // Only set to true if it's not already true, or handle it differently
      if (!showForecastPanel) {
        setShowForecastPanel(true);
      }

      if (!data || !mapRef.current) return;

      // Remove previous marker and close any open popups
      if (markerRef.current && mapRef.current.hasLayer?.(markerRef.current)) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (mapRef.current?.closePopup) {
        mapRef.current.closePopup();
      }

      const L = window.L;
      if (!L) return;

      if (dataType === "weather" && data.current) {
        const popupContent = createWeatherPopup(data, lat, lng, locationName);

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
            autoPan: true,
            closeOnClick: false,
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
            autoPan: true,
            closeOnClick: false,
          })
          .openPopup();
      }

      // Center map on selected location
      mapRef.current.setView([lat, lng], 10);
    },
    [
      rescueFlow,
      fetchLocationData,
      setCurrentLocation,
      setShowForecastPanel,
      setForecastData,
      showForecastPanel, // Add this dependency
    ]
  );
  useEffect(() => {
    if (!mapLoaded) return;
    // Set global functions immediately
    window.viewWeatherData = async (lat, lng, locationName) => {
      setShowControlsPanel(false);
      setShowAlertsPanel(false);
      await handleLocationDataFetch(lat, lng, locationName, "weather");
    };

    window.viewWaveData = async (lat, lng, locationName) => {
      setShowControlsPanel(false);
      setShowAlertsPanel(false);
      await handleLocationDataFetch(lat, lng, locationName, "waves");
    };

    window.selectDataType = async (lat, lng, dataType) => {
      setShowControlsPanel(false);
      setShowAlertsPanel(false);
      await handleLocationDataFetch(lat, lng, "Selected Location", dataType);
    };

    window.requestRescueAtLocation = (lat, lng) => {
      rescueFlow.requestRescueAt(lat, lng);
    };

    window.closePopup = () => {
      if (markerRef.current) {
        markerRef.current.closePopup();
      }
      if (mapRef.current?.closePopup) {
        mapRef.current.closePopup();
      }
    };

    // Cleanup function - FIXED: added requestRescueAtLocation
    return () => {
      window.viewWeatherData = undefined;
      window.viewWaveData = undefined;
      window.selectDataType = undefined;
      window.requestRescueAtLocation = undefined;
      window.closePopup = undefined;
    };
  }, [mapLoaded, handleLocationDataFetch, rescueFlow, fetchLocationData]); // Now this is stable due to useCallback

  useEffect(() => {
    // Only auto-show for initial load, not when user manually closes
    if (forecastData && currentLocation && !showForecastPanel) {
      const isInitialLoad = !rescueFlow.selectedLat; // Only auto-show if no location selected
      if (isInitialLoad) {
        console.log("Auto-showing forecast panel for:", currentLocation);
        setShowForecastPanel(true);
      }
    }
  }, [
    forecastData,
    currentLocation,
    showForecastPanel,
    rescueFlow.selectedLat,
  ]);

  // Layer toggle function
  const toggleLayer = (layerName, currentState, setState) => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const layer = map[layerName];
    if (currentState) {
      if (map.hasLayer?.(layer)) map.removeLayer(layer);
      setState(false);
    } else {
      layer?.addTo(map);
      setState(true);
    }
  };

  // Toggle functions - update these
  const toggleControlsPanel = () => {
    const newState = !showControlsPanel;
    setShowControlsPanel(newState);
    if (newState) {
      setShowAlertsPanel(false);
      setShowForecastPanel(false);
      setShowWeatherNotification(false); // Close weather notification
    }
  };

  const toggleAlertsPanel = () => {
    const newState = !showAlertsPanel;
    setShowAlertsPanel(newState);
    if (newState) {
      setShowControlsPanel(false);
      setShowForecastPanel(false);
    }
  };

  // Add this new toggle function for weather notification
  const toggleWeatherNotification = () => {
    const newState = !showWeatherNotification;
    setShowWeatherNotification(newState);
    if (newState) {
      setShowControlsPanel(false);
      setShowAlertsPanel(false);
      setShowForecastPanel(false);
    }
  };

  const closeAllPanels = () => {
    setShowControlsPanel(false);
    setShowAlertsPanel(false);
    setShowForecastPanel(false);
    setShowWeatherNotification(false); // Add this
  };

  // Add handler for showing detailed alerts from WeatherNotificationPanel
  const handleShowAlerts = () => {
    setShowWeatherNotification(false);
    setShowAlertsPanel(true);
  };

  //Handle forecast panel close - return to user location
  const handleForecastPanelClose = () => {
    setShowForecastPanel(false);

    // Reset to user location if available
    if (userLocation) {
      setCurrentLocation(userLocation);
      rescueFlow.setSelectedLat(null);
      rescueFlow.setSelectedLng(null);
    }
  };

  const selectedLocation =
    rescueFlow.selectedLat !== null
      ? {
          lat: rescueFlow.selectedLat,
          lng: rescueFlow.selectedLng,
          name: currentLocation?.name || "Selected Location",
        }
      : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] relative">
      {/* Navbar */}
      <Navbar />

      {/* Weather Notification Panel - Conditionally render */}
      {showWeatherNotification && (
        <WeatherNotificationPanel onShowAlerts={() => handleShowAlerts()} />
      )}

      {/* Map */}
      <div id="map" className="absolute inset-0 z-0 mt-16" />

      {/* Marine Visualizer */}
      <MarineVisualizer
        lat={rescueFlow.selectedLat}
        lng={rescueFlow.selectedLng}
      />

      {/* Main UI Container */}
      <div className="absolute z-10 flex flex-col gap-4 top-20 right-4">
        {/* Control Toggle Button - Update props */}
        <ControlToggleButton
          showControlsPanel={showControlsPanel}
          showAlertsPanel={showAlertsPanel}
          showWeatherNotification={showWeatherNotification}
          toggleControlsPanel={toggleControlsPanel}
          toggleAlertsPanel={toggleAlertsPanel}
          toggleWeatherNotification={toggleWeatherNotification}
          alertsCount={maritimeAlertsCount} // Just the count
        />

        {/* Control Panel */}
        <ControlPanel
          visible={showControlsPanel}
          onClose={() => setShowControlsPanel(false)}
          showTemperature={showTemperature}
          showPressure={showPressure}
          showStorm={showStorm}
          showPorts={showPorts}
          onToggleTemperature={() =>
            toggleLayer("tempLayer", showTemperature, setShowTemperature)
          }
          onTogglePressure={() =>
            toggleLayer("pressureLayer", showPressure, setShowPressure)
          }
          onToggleStorm={() =>
            toggleLayer("precipitationLayer", showStorm, setShowStorm)
          }
          onTogglePorts={togglePortMarkers}
          onLogout={() => navigate("/")}
        />

        {/* Alerts Panel */}
        <AlertsPanel
          visible={showAlertsPanel}
          onClose={() => setShowAlertsPanel(false)}
          alerts={alerts}
        />
      </div>

      {/* Forecast Panel - Positioned on left */}
      <ForecastPanel
        visible={showForecastPanel}
        onClose={handleForecastPanelClose}
        forecastData={forecastData}
        currentLocation={currentLocation}
        selectedLocation={selectedLocation}
      />

      {/* Admin-only Rescue Markers */}
      <AdminEmergencyMarkers mapRef={mapRef} />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-4 p-6 bg-[#1e1e1e] rounded-2xl">
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
