import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMapInitialization } from "../../hooks/useMapInitialization";
import { useWeatherData } from "../../hooks/useWeatherForecast";
import { useRescueFlow } from "../../hooks/useRescueFlow";
import { useAlerts } from "../../hooks/useAlerts";
import { usePortMarkers } from "../../hooks/usePortMarkers";
import { createWeatherPopup, createWavePopup } from "../../utils/mapUtils";
import ControlPanel from "../../components/MapComponents/ControlPanel";
import AlertsPanel from "../../components/MapComponents/AlertsPanel";
import ForecastPanel from "../../components/MapComponents/ForecastPanel";
import ControlToggleButton from "../../components/MapComponents/ControlToggleLayers";
import RescueModal from "../../components/MapComponents/RescueModal";
import Navbar from "../../components/Navbar";
import MarineVisualizer from "../../marineVisualizer/MarineVisualizer";
import AdminEmergencyMarkers from "../../components/MapComponents/AdminEmergencyMarkers";
import WeatherNotificationPanel from "../../components/MapComponents/WeatherNotificationPanel";
import {
  fetchWindDataForBounds,
  initializeWindLayer,
} from "../../utils/windLayerUtils";

export default function AdminMaps() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const warningMarkersRef = useRef([]);
  const windLayerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [showStorm, setShowStorm] = useState(false);
  const [showClouds, setShowClouds] = useState(false);
  const [showWind, setShowWind] = useState(false);
  const [windLoading, setWindLoading] = useState(false);
  const [showForecastPanel, setShowForecastPanel] = useState(false);
  const [showControlsPanel, setShowControlsPanel] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);

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
    warningMarkersRef,
    setMapLoaded,
    setShowForecastPanel,
    rescueFlow.requestRescueAt
  );

  useEffect(() => {
  if (!mapLoaded) return;

  const preloadWindLibrary = async () => {
    try {
      const module = await import('leaflet-velocity');
      console.log('Wind library preloaded successfully', {
        hasVelocityLayer: !!module.velocityLayer,
        hasDefault: !!module.default,
        moduleKeys: Object.keys(module)
      });
      
      // Also check if it's available on window.L
      if (window.L) {
        console.log('window.L.velocityLayer available:', !!window.L.velocityLayer);
      }
    } catch (error) {
      console.warn('Failed to preload wind library:', error);
    }
  };

  preloadWindLibrary();
}, [mapLoaded]);

  // Handle wind layer toggle - FIXED VERSION
  const toggleWindLayer = useCallback(async () => {
    if (!mapRef.current || !mapLoaded) {
      console.warn("Map not ready");
      return;
    }

    const map = mapRef.current;

    if (showWind && windLayerRef.current) {
      // Remove wind layer
      try {
        if (map.hasLayer(windLayerRef.current)) {
          map.removeLayer(windLayerRef.current);
        }
        windLayerRef.current = null;
        setShowWind(false);
        console.log("Wind layer removed");
      } catch (error) {
        console.error("Error removing wind layer:", error);
      }
    } else {
      // Add wind layer
      setWindLoading(true);

      try {
        console.log("Fetching wind data...");
        const windData = await fetchWindDataForBounds(map);

        if (!windData) {
          throw new Error("No wind data received");
        }

        console.log("Wind data received:", windData);

        // Remove old layer if exists
        if (windLayerRef.current) {
          try {
            if (map.hasLayer(windLayerRef.current)) {
              map.removeLayer(windLayerRef.current);
            }
          } catch (e) {
            console.warn("Error removing old wind layer:", e);
          }
        }

        // Create new wind layer - NOW AWAITING PROPERLY
        console.log("Initializing wind layer...");
        const windLayer = await initializeWindLayer(windData);

        if (!windLayer) {
          throw new Error("Failed to initialize wind layer");
        }

        windLayer.addTo(map);
        windLayerRef.current = windLayer;
        setShowWind(true);
        console.log("Wind layer added successfully");
      } catch (error) {
        console.error("Error loading wind layer:", error);
        alert(`Failed to load wind data: ${error.message}`);
        setShowWind(false);
      } finally {
        setWindLoading(false);
      }
    }
  }, [mapLoaded, showWind]);

  // Update wind layer when map moves (debounced) - FIXED VERSION
  useEffect(() => {
    if (!mapLoaded || !showWind || !mapRef.current) return;

    const map = mapRef.current;
    let moveTimeout;

    const updateWindLayer = async () => {
      try {
        console.log("Updating wind layer for new bounds...");
        const windData = await fetchWindDataForBounds(map);

        if (!windData || !windLayerRef.current) return;

        // Remove old layer
        if (map.hasLayer(windLayerRef.current)) {
          map.removeLayer(windLayerRef.current);
        }

        // Create and add new layer - ADD AWAIT HERE TOO
        const newWindLayer = await initializeWindLayer(windData);
        if (newWindLayer) {
          newWindLayer.addTo(map);
          windLayerRef.current = newWindLayer;
          console.log("Wind layer updated");
        }
      } catch (error) {
        console.error("Error updating wind layer:", error);
      }
    };

    const handleMoveEnd = () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(updateWindLayer, 2000);
    };

    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
      clearTimeout(moveTimeout);
    };
  }, [mapLoaded, showWind]);

  // Cleanup wind layer on unmount
  useEffect(() => {
    return () => {
      if (windLayerRef.current && mapRef.current) {
        try {
          if (mapRef.current.hasLayer(windLayerRef.current)) {
            mapRef.current.removeLayer(windLayerRef.current);
          }
        } catch (e) {
          console.warn("Error cleaning up wind layer:", e);
        }
      }
    };
  }, []);

  // Handle location data fetching - wrap in useCallback to prevent infinite re-renders
  const handleLocationDataFetch = useCallback(
    async (lat, lng, locationName, dataType) => {
      if (!lat || !lng) return;

      setShowForecastPanel(false);

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
      setShowForecastPanel(true);

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

    // Cleanup function
    return () => {
      window.viewWeatherData = undefined;
      window.viewWaveData = undefined;
      window.selectDataType = undefined;
      window.requestRescueAtLocation = undefined;
      window.closePopup = undefined;
    };
  }, [mapLoaded, handleLocationDataFetch, rescueFlow]);

  useEffect(() => {
    // Only auto-show for initial load, not when user manually closes
    if (forecastData && currentLocation && !showForecastPanel) {
      const isInitialLoad = !rescueFlow.selectedLat;
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

  const selectedLocation =
    rescueFlow.selectedLat !== null
      ? {
          lat: rescueFlow.selectedLat,
          lng: rescueFlow.selectedLng,
          name: currentLocation?.name || "Selected Location",
        }
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0C0623] to-slate-800">
      {/* Navbar */}
      <Navbar />

      {/* Weather Notification Panel */}
      <WeatherNotificationPanel />

      {/* Map */}
      <div id="map" className="absolute inset-0 z-0" />

      {/* Marine Visualizer */}
      <MarineVisualizer
        lat={rescueFlow.selectedLat}
        lng={rescueFlow.selectedLng}
      />

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
        showClouds={showClouds}
        showWind={showWind}
        showPorts={showPorts}
        windLoading={windLoading}
        onToggleTemperature={() =>
          toggleLayer("tempLayer", showTemperature, setShowTemperature)
        }
        onTogglePressure={() =>
          toggleLayer("pressureLayer", showPressure, setShowPressure)
        }
        onToggleStorm={() =>
          toggleLayer("precipitationLayer", showStorm, setShowStorm)
        }
        onToggleClouds={() =>
          toggleLayer("cloudsLayer", showClouds, setShowClouds)
        }
        onToggleWind={toggleWindLayer}
        onTogglePorts={togglePortMarkers}
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

      {/* Wind Loading Overlay */}
      {windLoading && (
        <div className="fixed inset-0 z-[2001] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-4 p-6 border border-blue-300/30 bg-blue-500/10 rounded-2xl backdrop-blur-2xl">
            <div className="w-8 h-8 border-b-2 border-blue-300 rounded-full animate-spin"></div>
            <div className="text-lg text-blue-100">Loading Wind Data...</div>
          </div>
        </div>
      )}

      {/* Rescue Modal */}
      <RescueModal {...rescueFlow} />
    </div>
  );
}
