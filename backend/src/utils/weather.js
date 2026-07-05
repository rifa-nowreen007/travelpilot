// Free weather via Open-Meteo — like Nominatim (geocode.js) and the OSM map
// tiles, this needs zero API key and has no request quota to manage, so
// there's nothing to configure in .env for this feature to work.
const { geocodeDestination } = require('./geocode');

// Open-Meteo "weather codes" (WMO) collapsed into short human labels +
// an emoji so the frontend doesn't need its own icon set for this.
const CODE_MAP = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'],
  80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Violent showers', '⛈️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm + hail', '⛈️'], 99: ['Thunderstorm + hail', '⛈️'],
};

function describeCode(code) {
  return CODE_MAP[code] || ['Unknown', '🌡️'];
}

// Returns current conditions + a short daily forecast for a destination
// string (or explicit lat/lng if already known, e.g. from a saved trip).
async function getWeather({ destination, lat, lng }) {
  let coords = lat !== undefined && lng !== undefined ? { lat, lng } : null;
  if (!coords) coords = await geocodeDestination(destination);
  if (!coords) return null;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&forecast_days=7&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();

  const [currentLabel, currentIcon] = describeCode(data.current?.weather_code);

  const daily = (data.daily?.time || []).map((date, i) => {
    const [label, icon] = describeCode(data.daily.weather_code[i]);
    return {
      date,
      label,
      icon,
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      rainChance: data.daily.precipitation_probability_max[i],
    };
  });

  return {
    destination,
    coords,
    current: {
      temp: Math.round(data.current?.temperature_2m),
      humidity: data.current?.relative_humidity_2m,
      windSpeed: data.current?.wind_speed_10m,
      label: currentLabel,
      icon: currentIcon,
    },
    daily,
  };
}

module.exports = { getWeather };
