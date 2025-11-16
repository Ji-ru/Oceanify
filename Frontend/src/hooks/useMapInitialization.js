import { useEffect } from "react";

export const useMapInitialization = (
  mapRef,
  markerRef,
  setMapLoaded,
  setShowForecastPanel,
  requestRescueAt,
  setUserLocation 
) => {
  useEffect(() => {
    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

    const loadLeaflet = async () => {
      try {
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href =
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
          document.head.appendChild(link);
        }

        if (!window.L) {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
          script.onload = initializeMap;
          document.head.appendChild(script);
        } else {
          initializeMap();
        }
      } catch (err) {
        console.error("Failed to load Leaflet", err);
      }
    };

    const initializeMap = () => {
      const L = window.L;
      if (!L) return console.error("Leaflet failed to load");

      const map = L.map("map").setView([8.0, 125.0], 6);
      mapRef.current = map;

      // Base tiles with dark theme
      L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
        }
      ).addTo(map);

      // Weather layers
      const tempLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { opacity: 0.6 }
      );
      const pressureLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { opacity: 0.6 }
      );
      const precipitationLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { opacity: 0.6 }
      );

      tempLayer.addTo(map);
      map.tempLayer = tempLayer;
      map.pressureLayer = pressureLayer;
      map.precipitationLayer = precipitationLayer;

      setMapLoaded(true);

      // Center on user if available
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          const userIcon = L.divIcon({
            html: `
        <div 
          style="
            width: 28px;
            height: 28px;
            background-color: #3b82f6; 
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "
        >
          <span style="font-size:16px;">📍</span>
        </div>
      `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            className: "",
          });

          L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
          map.setView([latitude, longitude], 7);
          
          // ✅ SET THE USER LOCATION HERE
          if (setUserLocation) {
            setUserLocation({
              lat: latitude,
              lng: longitude,
              name: "Your Location"
            });
          }
        },
        (err) => {
          console.warn("Geolocation error:", err);
          // ✅ Set a default location if geolocation fails
          if (setUserLocation) {
            setUserLocation({
              lat: 8.0,
              lng: 125.0,
              name: "Default Location"
            });
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Map click handler
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;

        // Create data selection popup
        const selectionPopupContent = `
  <div style="min-width: 200px; padding: 12px;">
    <div style="text-align: center; margin-bottom: 12px;">
      <h3 style="margin: 0 0 6px 0; color: #2c3e50; font-size: 14px; font-weight: bold;">
        📍 Location Data
      </h3>
      <div style="color: #7f8c8d; font-size: 10px;">
        ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
      </div>
    </div>

    <div style="display: grid; gap: 8px; margin-bottom: 12px;">
      <button 
        onclick="window.selectDataType(${lat}, ${lng}, 'weather')"
        style="
          padding: 10px 12px;
          background: linear-gradient(135deg, #ff6b6b, #ee5a52);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        "
        onmouseover="this.style.transform='scale(1.02)'"
        onmouseout="this.style.transform='scale(1)'"
      >
        🌤️ View Weather Data
      </button>
      
      <button 
        onclick="window.selectDataType(${lat}, ${lng}, 'waves')"
        style="
          padding: 10px 12px;
          background: linear-gradient(135deg, #74b9ff, #0984e3);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        "
        onmouseover="this.style.transform='scale(1.02)'"
        onmouseout="this.style.transform='scale(1)'"
      >
        🌊 View Wave Data
      </button>
    </div>

    <div style="border-top: 1px solid #e9ecef; padding-top: 10px;">
      <button 
        onclick="window.requestRescueAtLocation(${lat}, ${lng})"
        style="
          width: 100%;
          padding: 8px 12px;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        "
        onmouseover="this.style.transform='scale(1.02)'"
        onmouseout="this.style.transform='scale(1)'"
      >
        🆘 Request Emergency Rescue
      </button>
      <div style="font-size: 9px; color: #6c757d; text-align: center; margin-top: 5px;">
        For genuine emergencies only
      </div>
    </div>
  </div>
`;

        const selectionIcon = L.divIcon({
          html: `
    <div style="
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    ">
      <!-- Inner Circle -->
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
        margin-top: 3px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      ">
        <span style="font-size: 16px; margin-top: -1px;">📍</span>
      </div>
      
      <!-- Pulse Effect -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.4);
        animation: pulse 2s infinite;
      "></div>
      
      <style>
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
      </style>
    </div>
  `,
          iconSize: [40, 48],
          iconAnchor: [20, 44],
          popupAnchor: [0, -44],
          className: "custom-map-pin",
        });

        // Remove previous marker
        if (markerRef.current && map.hasLayer(markerRef.current)) {
          map.removeLayer(markerRef.current);
        }

        markerRef.current = L.marker([lat, lng], { icon: selectionIcon })
          .addTo(map)
          .bindPopup(selectionPopupContent, {
            maxWidth: 320,
            className: "selection-popup",
            autoPan: true,
          })
          .openPopup();
      });
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {}
      }
    };
  }, [setUserLocation]); // Add setUserLocation to dependencies
};