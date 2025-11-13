import { useState, useRef, useEffect } from 'react';
import mindanaoPorts from '../data/ports.json';
import { getPortIcon } from '../utils/mapUtils';

export const usePortMarkers = (mapRef, mapLoaded) => {
  const [showPorts, setShowPorts] = useState(true);
  const portMarkersRef = useRef([]);

  const addPortMarkers = (map) => {
    const L = window.L;
    if (!L || !mindanaoPorts?.ports_of_mindanao) return;

    removePortMarkers();

    mindanaoPorts.ports_of_mindanao.forEach((port) => {
      const icon = getPortIcon(port.type);
      if (!icon) return;

      const marker = L.marker([port.latitude, port.longitude], { icon }).addTo(map)
        .bindPopup(`
          <div style="min-width: 200px; padding: 12px;">
            <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 16px; font-weight: bold;">
              ${port.port_name}
            </h3>
            <div style="color: #7f8c8d; font-size: 12px; margin-bottom: 8px;">
              📍 ${port.location}
            </div>
            <div style="color: #34495e; font-size: 12px; margin-bottom: 12px;">
              🏷️ Type: ${port.type}
            </div>
            <div style="color: #7f8c8d; font-size: 11px; margin-bottom: 16px;">
              Coordinates: ${port.latitude.toFixed(4)}°N, ${port.longitude.toFixed(4)}°E
            </div>
            
            <div style="display: grid; gap: 8px;">
              <button 
                onclick="window.viewWeatherData(${port.latitude}, ${port.longitude}, '${port.port_name.replace(/'/g, "\\'")}')"
                style="
                  padding: 10px 16px;
                  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 600;
                  transition: all 0.2s ease;
                "
                onmouseover="this.style.transform='scale(1.02)'"
                onmouseout="this.style.transform='scale(1)'"
              >
                🌤️ View Weather Data
              </button>
              
              <button 
                onclick="window.viewWaveData(${port.latitude}, ${port.longitude}, '${port.port_name.replace(/'/g, "\\'")}')"
                style="
                  padding: 10px 16px;
                  background: linear-gradient(135deg, #74b9ff, #0984e3);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 600;
                  transition: all 0.2s ease;
                "
                onmouseover="this.style.transform='scale(1.02)'"
                onmouseout="this.style.transform='scale(1)'"
              >
                🌊 View Wave Data
              </button>
            </div>
          </div>
        `);

      portMarkersRef.current.push(marker);
    });

  };

  const removePortMarkers = () => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    portMarkersRef.current.forEach((marker) => {
      if (mapRef.current.hasLayer(marker)) {
        mapRef.current.removeLayer(marker);
      }
    });
    portMarkersRef.current = [];
  };

  const togglePortMarkers = () => {
    if (!mapRef.current || !mapLoaded) return;

    if (showPorts) {
      removePortMarkers();
      setShowPorts(false);
    } else {
      addPortMarkers(mapRef.current);
      setShowPorts(true);
    }
  };

  useEffect(() => {
    if (mapLoaded && showPorts && mapRef.current) {
      addPortMarkers(mapRef.current);
    }
  }, [mapLoaded]);

  return {
    portMarkers: portMarkersRef.current,
    showPorts,
    setShowPorts,
    togglePortMarkers,
    addPortMarkers,
    removePortMarkers
  };
};