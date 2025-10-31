import { useEffect } from 'react';
import { GRID_STEP, THRESHOLDS } from '../utils/constants';
import { fetchMarineData, fetchCurrentWeather } from '../utils/weatherApi';
import { createEnhancedPopup } from '../components/PopupContent';

export const useMapInitialization = (
  mapRef,
  markerRef,
  warningMarkersRef,
  setMapLoaded,
  setShowForecastPanel,
  requestRescueAt
) => {
  useEffect(() => {
    const API_KEY = "60b8ffcce91b8ebdc127d1219e56e0f5";

    const loadLeaflet = async () => {
      try {
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
          document.head.appendChild(link);
        }

        if (!window.L) {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
          script.onload = initializeMap;
          document.head.appendChild(script);
        } else {
          initializeMap();
        }
      } catch (err) {
        console.error("Failed to load Leaflet", err);
      }
    };

    const clearWarningMarkers = () => {
      if (!mapRef.current) return;
      const L = window.L;
      (warningMarkersRef.current || []).forEach((m) => {
        try {
          if (mapRef.current.hasLayer(m)) mapRef.current.removeLayer(m);
        } catch (e) {}
      });
      warningMarkersRef.current = [];
    };

    const addWarningMarker = (lat, lng, summary, details = {}) => {
      if (!mapRef.current || !window.L) return;
      const L = window.L;

      const marker = L.circleMarker([lat, lng], {
        radius: 16,
        color: "#ff8c00",
        fillColor: "#ffb86b",
        fillOpacity: 0.8,
        weight: 3,
      }).addTo(mapRef.current);

      const popupHtml = `
        <div class="min-w-[240px] p-3 bg-gradient-to-br from-orange-900/90 to-yellow-900/70 rounded-xl border border-orange-500/30 backdrop-blur-sm">
          <h3 class="text-white font-bold mb-2 flex items-center gap-2">
            <span>⚠️</span>
            Strong Storm Area
          </h3>
          <div class="text-orange-200 text-sm mb-3">
            ${summary}
          </div>
          <div class="text-orange-300 text-xs mb-3 space-y-1">
            <div><b>Wind:</b> ${details.wind_speed ?? "N/A"} km/h</div>
            <div><b>Gust:</b> ${details.wind_gust ?? "N/A"} km/h</div>
            <div><b>Wave:</b> ${details.wave_height ?? "N/A"} m</div>
            <div><b>Precip:</b> ${details.precipitation ?? "N/A"} mm</div>
          </div>
          <div class="flex gap-2">
            <button class="view-more-btn flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 text-white border-none cursor-pointer transition-all hover:scale-105" data-lat="${lat}" data-lng="${lng}">
              View Details
            </button>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);
      warningMarkersRef.current.push(marker);
    };

    const scanStormsInBounds = async () => {
      if (!mapRef.current || !window.L) return;
      const map = mapRef.current;
      clearWarningMarkers();

      const bounds = map.getBounds();
      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const west = bounds.getWest();
      const east = bounds.getEast();

      const latSteps = [];
      for (let lat = Math.max(-89.5, south); lat <= Math.min(89.5, north); lat = +(lat + GRID_STEP).toFixed(6)) {
        latSteps.push(lat);
      }
      
      const lngSteps = [];
      let normalizedWest = west;
      let normalizedEast = east;
      if (east < west) normalizedEast = east + 360;
      for (let lng = normalizedWest; lng <= normalizedEast; lng = +(lng + GRID_STEP).toFixed(6)) {
        const normalizedLng = ((lng + 540) % 360) - 180;
        lngSteps.push(normalizedLng);
      }

      const points = [];
      for (const lat of latSteps) {
        for (const lng of lngSteps) {
          points.push({ lat, lng });
        }
      }

      const MAX_POINTS = 80;
      const chunked = points.slice(0, MAX_POINTS);

      const concurrency = 5;
      for (let i = 0; i < chunked.length; i += concurrency) {
        const batch = chunked.slice(i, i + concurrency);
        await Promise.all(
          batch.map(async (pt) => {
            try {
              const marineData = await fetchMarineData(pt.lat, pt.lng);
              if (!marineData?.current || marineData.current.wave_height == null) {
                return;
              }

              const weatherData = await fetchCurrentWeather(pt.lat, pt.lng);
              const w = weatherData?.current || {};

              const wave_h = Number(marineData.current.wave_height ?? 0);
              const wind_s = Number(w.wind_speed_10m ?? 0);
              const wind_g = Number(w.wind_gusts_10m ?? 0);
              const precip = Number(w.precipitation ?? 0);

              const isSevere =
                wave_h >= THRESHOLDS.wave_height_m ||
                wind_s >= THRESHOLDS.wind_speed_kmh ||
                wind_g >= THRESHOLDS.wind_gust_kmh ||
                precip >= THRESHOLDS.precipitation_mm_h;

              if (isSevere) {
                const summaryParts = [];
                if (wind_s >= THRESHOLDS.wind_speed_kmh) summaryParts.push(`Wind ${Math.round(wind_s)} km/h`);
                if (wind_g >= THRESHOLDS.wind_gust_kmh) summaryParts.push(`Gust ${Math.round(wind_g)} km/h`);
                if (wave_h >= THRESHOLDS.wave_height_m) summaryParts.push(`Wave ${wave_h.toFixed(1)} m`);
                if (precip >= THRESHOLDS.precipitation_mm_h) summaryParts.push(`Precip ${precip} mm`);
                const summary = summaryParts.join(" • ") || "Strong marine conditions";

                addWarningMarker(pt.lat, pt.lng, summary, {
                  wind_speed: Math.round(wind_s),
                  wind_gust: Math.round(wind_g),
                  wave_height: wave_h,
                  precipitation: precip,
                });
              }
            } catch (err) {
              // ignore per-point errors
            }
          })
        );
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
          attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
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
          })
          .openPopup();

        // Set global functions
        window.selectDataType = async (lat, lng, dataType) => {
          // This will be handled by the main component
        };

        window.requestRescueAtLocation = (lat, lng) => {
          const reason = prompt(
            "Enter rescue reason (e.g. 'sinking', 'engine malfunction', 'medical emergency'):",
            "emergency distress"
          );
          if (reason) {
            requestRescueAt(lat, lng, reason);
          }
        };
      });

      // Popup event handlers
      map.on("popupopen", function (e) {
        const container = e.popup && e.popup._contentNode;
        if (!container) return;

        const viewBtn = container.querySelector(".view-more-btn");
        if (viewBtn) {
          viewBtn.onclick = () => {
            const lat = parseFloat(viewBtn.dataset.lat);
            const lng = parseFloat(viewBtn.dataset.lng);
            map.setView([lat, lng], Math.max(map.getZoom(), 9));
          };
        }
      });

      // Initial scan and movement handlers
      setTimeout(() => {
        scanStormsInBounds();
      }, 1200);

      map.on("moveend", () => {
        clearWarningMarkers();
        scanStormsInBounds();
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