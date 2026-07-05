// Free geocoding via OpenStreetMap's Nominatim (same data source Leaflet
// already uses for map tiles, so no new API key is required). Turns a typed
// destination string like "Manali, Himachal Pradesh" into real coordinates
// so trips can actually be plotted on the map.
//
// Nominatim's usage policy requires a descriptive User-Agent and asks for
// max ~1 request/second, which is fine here since this only runs once per
// trip creation/update.

async function geocodeDestination(destination) {
  if (!destination || !destination.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(destination)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TravelPilot/1.0 (travel companion app)' },
    });
    if (!res.ok) return null;
    const results = await res.json();
    if (!results || !results.length) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch (err) {
    console.error('Geocoding failed:', err.message);
    return null;
  }
}

module.exports = { geocodeDestination };
