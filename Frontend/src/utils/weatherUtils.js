export const degToCompass = (deg) => {
  if (deg === null || deg === undefined) return "N/A";
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", 
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
  ];
  const idx = Math.floor(((deg % 360) + 360) / 22.5 + 0.5) % 16;
  return directions[idx];
};

export const getWeatherIcon = (code, isDay = true) => {
  const weatherIcons = {
    0: isDay ? "☀️" : "🌙",
    1: isDay ? "🌤️" : "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    // ... rest of icons
  };
  return weatherIcons[code] || "🌈";
};

export const getWeatherDescription = (code) => {
  const codes = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    // ... rest of descriptions
  };
  return codes[code] || `Code: ${code}`;
};

export const formatValue = (value, unit = "", decimals = 1) => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "number") {
    return decimals === 0
      ? `${Math.round(value)}${unit}`
      : `${value.toFixed(decimals)}${unit}`;
  }
  return `${value}${unit}`;
};