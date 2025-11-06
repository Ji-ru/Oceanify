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
    2: "⛅", // Partly cloudy
    3: "☁️", // Overcast
    45: "🌫️", // Fog
    48: "🌫️", // Depositing rime fog
    51: "🌦️", // Light drizzle
    53: "🌦️", // Moderate drizzle
    55: "🌧️", // Dense drizzle
    61: "🌦️", // Slight rain
    63: "🌧️", // Moderate rain
    65: "🌧️", // Heavy rain
    71: "🌨️", // Slight snow
    73: "🌨️", // Moderate snow
    75: "🌨️", // Heavy snow
    77: "🌨️", // Snow grains
    80: "🌦️", // Slight rain showers
    81: "🌧️", // Moderate rain showers
    82: "⛈️", // Violent rain showers
    85: "🌨️", // Slight snow showers
    86: "🌨️", // Heavy snow showers
    95: "⛈️", // Thunderstorm
    96: "⛈️", // Thunderstorm with slight hail
    99: "⛈️", // Thunderstorm with heavy hail
  };
  return weatherIcons[code] || "🌈";
};

export const getWeatherDescription = (code) => {
  const codes = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
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