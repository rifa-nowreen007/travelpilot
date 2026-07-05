// Real-world latitude/longitude route points for demo trips.
// Each point: { lat, lng, label, time? }. Consumed by <LeafletMap /> to draw
// an OpenStreetMap route with markers — no API key required.

export const ROUTE_MANALI = [
  { lat: 28.7041, lng: 77.1025, label: 'Delhi' },
  { lat: 30.7333, lng: 76.7794, label: 'Chandigarh' },
  { lat: 31.6340, lng: 76.9160, label: 'Bilaspur' },
  { lat: 32.2432, lng: 77.1892, label: 'Manali' },
];

export const ROUTE_RISHIKESH = [
  { lat: 28.7041, lng: 77.1025, label: 'Delhi' },
  { lat: 29.8543, lng: 77.8880, label: 'Roorkee' },
  { lat: 29.9457, lng: 78.1642, label: 'Haridwar' },
  { lat: 30.0869, lng: 78.2676, label: 'Rishikesh' },
];

export const ROUTE_GOA = [
  { lat: 19.0760, lng: 72.8777, label: 'Mumbai' },
  { lat: 16.9902, lng: 73.3120, label: 'Ratnagiri' },
  { lat: 15.2993, lng: 74.1240, label: 'Goa' },
];

export const ROUTE_JAIPUR = [
  { lat: 28.7041, lng: 77.1025, label: 'Delhi' },
  { lat: 27.5530, lng: 76.6346, label: 'Alwar' },
  { lat: 26.9124, lng: 75.7873, label: 'Jaipur' },
];

// Live Trip Demo — matches the timeline steps shown on that page.
export const ROUTE_LIVE_DEMO = [
  { lat: 28.7041, lng: 77.1025, label: 'Delhi', time: '06:00 AM' },
  { lat: 29.8543, lng: 77.8880, label: 'Roorkee', time: '09:15 AM' },
  { lat: 29.9457, lng: 78.1642, label: 'Haridwar', time: '11:40 AM' },
  { lat: 30.0869, lng: 78.2676, label: 'Rishikesh', time: '01:30 PM' },
];
