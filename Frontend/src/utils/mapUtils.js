import { PORT_TYPES } from './constants';

export const getPortIcon = (portType) => {
  const L = window.L;
  if (!L) return null;

  const portConfig = PORT_TYPES[portType] || { color: '#34495e', emoji: '📍' };

  return L.divIcon({
    html: `
      <div style="
        background: ${portConfig.color};
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        ${portConfig.emoji}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    className: "port-marker",
  });
};

export const createWavePopup = (waveData, lat, lng, locationName = "Selected Location") => {
  const formatValue = (value, unit = "", decimals = 1) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") {
      return decimals === 0
        ? `${Math.round(value)}${unit}`
        : `${value.toFixed(decimals)}${unit}`;
    }
    return `${value}${unit}`;
  };

  const degToCompass = (deg) => {
    if (deg === null || deg === undefined) return "N/A";
    const directions = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    const idx = Math.floor(((deg % 360) + 360) / 22.5 + 0.5) % 16;
    return directions[idx];
  };

  return `
    <div style="min-width: 280px; padding: 12px;">
      <div style="text-align: center; margin-bottom: 16px;">
        <h3 style="margin: 0 0 4px 0; color: #2c3e50; font-size: 18px; font-weight: bold;">
          🌊 Wave Conditions
        </h3>
        <div style="color: #7f8c8d; font-size: 12px;">
          ${locationName}
        </div>
        <div style="color: #95a5a6; font-size: 11px; margin-top: 4px;">
          ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #74b9ff, #0984e3); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 24px; font-weight: bold; color: white;">
              ${formatValue(waveData?.current?.wave_height, " m", 1)}
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.9);">Wave Height</div>
          </div>
          <div style="font-size: 32px;">🌊</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; text-align: center;">
          <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Wave Direction</div>
          <div style="font-size: 14px; font-weight: bold; color: #2c3e50;">
            ${degToCompass(waveData?.current?.wave_direction)}
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; text-align: center;">
          <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Swell Height</div>
          <div style="font-size: 14px; font-weight: bold; color: #2c3e50;">
            ${formatValue(waveData?.current?.swell_wave_height, " m", 1)}
          </div>
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
        <div style="font-size: 12px; font-weight: bold; color: #2c3e50; margin-bottom: 8px;">Swell Details</div>
        <div style="display: grid; gap: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span style="color: #7f8c8d;">Primary Direction:</span>
            <span style="font-weight: bold; color: #2c3e50;">${degToCompass(waveData?.current?.swell_wave_direction)}</span>
          </div>
          <div style="display: flex; justify-content: between; font-size: 11px;">
            <span style="color: #7f8c8d;">Secondary Height:</span>
            <span style="font-weight: bold; color: #2c3e50;">${formatValue(waveData?.current?.secondary_swell_wave_height, " m", 1)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span style="color: #7f8c8d;">Secondary Period:</span>
            <span style="font-weight: bold; color: #2c3e50;">${formatValue(waveData?.current?.secondary_swell_wave_period, "s", 1)}</span>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 8px;">
        <button 
          onclick="window.viewWeatherData(${lat}, ${lng}, '${locationName.replace(/'/g, "\\'")}')"
          style="
            flex: 1;
            padding: 8px 12px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
          "
        >
          View Weather
        </button>
        <button 
          onclick="window.closePopup()"
          style="
            padding: 8px 12px;
            background: #95a5a6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
          "
        >
          Close
        </button>
      </div>
    </div>
  `;
};