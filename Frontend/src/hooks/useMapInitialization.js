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
            html: `<div class="user-location-marker"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          L.marker([latitude, longitude], { icon: userIcon }).addTo(map)
            .bindPopup(`
              <div class="p-3 bg-gradient-to-br from-blue-900/90 to-purple-900/70 rounded-xl border border-blue-500/30 backdrop-blur-sm">
                <div class="text-white font-bold flex items-center gap-2">
                  <span>📍</span>
                  Your Location
                </div>
                <div class="text-blue-200 text-sm mt-1">
                  ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E
                </div>
                <div class="flex gap-2 mt-3">
                  <button 
                    onclick="window.viewWeatherData(${latitude}, ${longitude}, 'Your Location')"
                    class="flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white border-none cursor-pointer text-xs font-semibold"
                  >
                    View Weather
                  </button>
                  <button 
                    onclick="window.viewWaveData(${latitude}, ${longitude}, 'Your Location')"
                    class="flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none cursor-pointer text-xs font-semibold"
                  >
                    View Waves
                  </button>
                </div>
              </div>
            `);

          map.setView([latitude, longitude], 7);
        },
        (err) => console.warn("Geolocation error:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Map click handler
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;

        // Create data selection popup
        const selectionPopupContent = `
          <div style="min-width: 280px; padding: 16px;">
            <div style="text-align: center; margin-bottom: 16px;">
              <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 18px; font-weight: bold;">
                📍 Location Data
              </h3>
              <div style="color: #7f8c8d; font-size: 12px;">
                ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
              </div>
            </div>

            <div style="display: grid; gap: 10px; margin-bottom: 16px;">
              <button 
                onclick="window.selectDataType(${lat}, ${lng}, 'weather')"
                style="
                  padding: 12px 16px;
                  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 600;
                  transition: all 0.2s ease;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                "
                onmouseover="this.style.transform='scale(1.02)'"
                onmouseout="this.style.transform='scale(1)'"
              >
                🌤️ View Weather Data
              </button>
              
              <button 
                onclick="window.selectDataType(${lat}, ${lng}, 'waves')"
                style="
                  padding: 12px 16px;
                  background: linear-gradient(135deg, #74b9ff, #0984e3);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 600;
                  transition: all 0.2s ease;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                "
                onmouseover="this.style.transform='scale(1.02)'"
                onmouseout="this.style.transform='scale(1)'"
              >
                🌊 View Wave Data
              </button>
            </div>

            <div style="border-top: 1px solid #e9ecef; padding-top: 12px;">
              <button 
                onclick="window.requestRescueAtLocation(${lat}, ${lng})"
                style="
                  width: 100%;
                  padding: 10px 16px;
                  background: linear-gradient(135deg, #dc2626, #b91c1c);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 13px;
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
                🆘 Request Emergency Rescue
              </button>
              <div style="font-size: 10px; color: #6c757d; text-align: center; margin-top: 6px;">
                For genuine emergencies only
              </div>
            </div>
          </div>
        `;

        const selectionIcon = L.divIcon({
          html: `<div style="background: linear-gradient(135deg, #10b981, #059669); color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.3);">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
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
            autoPan: true
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
  }, []);
};
