// Free, keyless nearby-places lookup via OpenStreetMap's Overpass API —
// the same underlying data source as the Leaflet map tiles already used
// in this app. Finds real hospitals and police stations around a given
// point, with distance and phone number when OSM has that data tagged.

// The public overpass-api.de instance is frequently overloaded/rate-limited
// (504s are common). Try a couple of known-good mirrors before giving up,
// so a single instance being down doesn't take out this whole feature.
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findNearby(lat, lng, radiusMeters = 8000) {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="police"](around:${radiusMeters},${lat},${lng});
      way["amenity"="police"](around:${radiusMeters},${lat},${lng});
    );
    out center 20;
  `;

  let data = null;
  let lastError = null;
  for (const url of OVERPASS_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        lastError = new Error(`Overpass mirror ${url} returned ${res.status}`);
        continue; // try the next mirror
      }
      data = await res.json();
      break;
    } catch (err) {
      lastError = err;
      // network error / timeout / DNS block — try the next mirror
    }
  }
  if (!data) {
    console.error('All Overpass mirrors failed:', lastError?.message);
    throw lastError || new Error('All Overpass mirrors failed');
  }
  const results = (data.elements || [])
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return null;
      const tags = el.tags || {};
      return {
        id: el.id,
        type: tags.amenity, // 'hospital' | 'police'
        name: tags.name || (tags.amenity === 'hospital' ? 'Unnamed hospital' : 'Unnamed police station'),
        phone: tags.phone || tags['contact:phone'] || null,
        lat: elLat,
        lng: elLng,
        distanceKm: Math.round(distanceKm(lat, lng, elLat, elLng) * 10) / 10,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    hospitals: results.filter((r) => r.type === 'hospital').slice(0, 6),
    police: results.filter((r) => r.type === 'police').slice(0, 6),
  };
}

module.exports = { findNearby };
