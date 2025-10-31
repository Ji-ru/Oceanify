export const GRID_STEP = 0.5;

export const THRESHOLDS = {
  wind_speed_kmh: 50,
  wind_gust_kmh: 70,
  precipitation_mm_h: 15,
  wave_height_m: 2.5,
};

export const WEATHER_API_BASE = 'https://api.open-meteo.com/v1';
export const MARINE_API_BASE = 'https://marine-api.open-meteo.com/v1';

export const PORT_TYPES = {
  'International Container Port': { color: '#e74c3c', emoji: '⚓' },
  'International Port': { color: '#e74c3c', emoji: '⚓' },
  'Base Port': { color: '#3498db', emoji: '🏭' },
  'Container Terminal': { color: '#9b59b6', emoji: '🚢' },
  'Terminal Port': { color: '#f39c12', emoji: '⛴️' },
  'Municipal Port': { color: '#2ecc71', emoji: '🏘️' },
  'Private Port': { color: '#95a5a6', emoji: '🔒' },
};

export const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];