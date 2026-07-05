import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';

// Free OSM tile layers — no API key required for either.
const TILE_LIGHT = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};
const TILE_DARK = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

const TEAL = '#0FBFA6';
const SUNSET = '#FF7A45';

function lerpColor(a, b, t) {
  const ah = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const bh = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  const rgb = ah.map((v, i) => Math.round(v + (bh[i] - v) * t));
  return `rgb(${rgb.join(',')})`;
}

function dotIcon(color, pulse = false) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:18px;height:18px;">
        ${pulse ? `<span style="position:absolute;inset:-9px;border-radius:9999px;background:${color};opacity:0.35;animation:tp-pulse 1.8s ease-out infinite;"></span>` : ''}
        <span style="position:absolute;inset:0;border-radius:9999px;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></span>
      </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Inject keyframes + leaflet popup theming once.
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes tp-pulse { 0% { transform: scale(0.6); opacity: 0.55; } 100% { transform: scale(2.2); opacity: 0; } }
    .tp-leaflet-popup .leaflet-popup-content-wrapper { background: #0A1F3D; color: #fff; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
    .tp-leaflet-popup .leaflet-popup-tip { background: #0A1F3D; }
    .tp-leaflet-popup .leaflet-popup-content { margin: 8px 12px; font-family: 'Inter', sans-serif; font-size: 12.5px; }
    .leaflet-container { font-family: 'Inter', sans-serif; background: #cfe3ea; }
  `;
  document.head.appendChild(style);
}

/**
 * Real interactive OpenStreetMap (via Leaflet) showing a route polyline and
 * labelled markers. Free — no API key required. Used for the Live Trip Demo
 * map and trip preview cards across the dashboard.
 */
export default function LeafletMap({
  points,
  height = 220,
  className = '',
  interactive = true,
  showLabelBadge = true,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const themeCtx = useTheme();
  const theme = themeCtx?.theme || 'light';

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !points || points.length === 0) return;

    const map = L.map(containerRef.current, {
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: false,
      attributionControl: interactive,
    });
    mapRef.current = map;

    const tiles = theme === 'dark' ? TILE_DARK : TILE_LIGHT;
    L.tileLayer(tiles.url, {
      attribution: interactive ? tiles.attribution : '',
      subdomains: theme === 'dark' ? 'abcd' : 'abc',
      maxZoom: 19,
    }).addTo(map);

    const latlngs = points.map((p) => [p.lat, p.lng]);

    // Draw route as colored segments (teal -> sunset gradient feel).
    points.slice(0, -1).forEach((p, i) => {
      const t = points.length > 1 ? i / (points.length - 1) : 0;
      L.polyline([[p.lat, p.lng], [points[i + 1].lat, points[i + 1].lng]], {
        color: lerpColor(TEAL, SUNSET, t),
        weight: 4,
        opacity: 0.9,
        lineCap: 'round',
      }).addTo(map);
    });

    // Markers: teal start, white waypoints, pulsing sunset end.
    points.forEach((p, i) => {
      const isStart = i === 0;
      const isEnd = i === points.length - 1;
      const color = isStart ? TEAL : isEnd ? SUNSET : '#94A3B8';
      const marker = L.marker([p.lat, p.lng], { icon: dotIcon(color, isEnd) }).addTo(map);
      if (p.label) {
        marker.bindPopup(
          `<strong>${p.label}</strong>${p.time ? `<br/><span style="opacity:.6">${p.time}</span>` : ''}`,
          { className: 'tp-leaflet-popup', closeButton: false }
        );
      }
    });

    if (latlngs.length === 1) {
      map.setView(latlngs[0], 12);
    } else {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [28, 28] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), theme, interactive]);

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`} style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
      {showLabelBadge && points?.[0]?.label && (
        <span className="absolute bottom-2 left-2 z-[400] text-[10px] font-medium text-white/90 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
          {points[0].label} → {points[points.length - 1].label}
        </span>
      )}
    </div>
  );
}
