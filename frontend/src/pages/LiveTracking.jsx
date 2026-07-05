import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineLocationMarker, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineTruck, HiOutlinePlay, HiOutlineStop,
  HiOutlineFolderOpen,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import LeafletMap from '../components/LeafletMap';
import { ROUTE_LIVE_DEMO } from '../lib/tripRoutes';

const TABS = [
  { key: 'timeline', label: 'Live Timeline', icon: HiOutlineClock },
];

// Haversine distance in km between two lat/lng points.
function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function formatElapsed(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

export default function LiveTracking() {
  const { user } = useAuth();
  const isDemo = !user || user.demo;

  const [tab, setTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [points, setPoints] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [geoError, setGeoError] = useState('');
  const watchIdRef = useRef(null);

  async function load() {
    if (isDemo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/trips/active');
      setTrip(data.trip);
      setPoints(data.points || []);
    } catch {
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  // Real live tracking: watches the browser's GPS and pushes a point to the
  // backend every time it moves meaningfully, so the route/timeline fill in
  // for real instead of being pre-scripted.
  const toggleSharing = () => {
    if (sharing) {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setSharing(false);
      return;
    }
    if (!navigator.geolocation) {
      setGeoError('Your browser does not support GPS location.');
      return;
    }
    setGeoError('');
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await api.post(`/trips/${trip.id}/location`, { lat: latitude, lng: longitude });
          setPoints((prev) => [...prev, { latitude, longitude, label: 'Live position', recorded_at: new Date().toISOString() }]);
        } catch {
          /* keep watching even if one ping fails */
        }
      },
      () => setGeoError('Location permission denied — enable it in your browser to share your live position.'),
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
    setSharing(true);
  };

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  // ---- Demo mode: original scripted showcase, unchanged ----
  if (isDemo) {
    return <DemoTracking />;
  }

  if (loading) {
    return (
      <PageWrapper>
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24 pt-10 text-center text-midnight-900/50 dark:text-white/50">
          Loading your trip…
        </section>
      </PageWrapper>
    );
  }

  if (!trip) {
    return (
      <PageWrapper>
        <section className="max-w-3xl mx-auto px-6 lg:px-8 pb-24 pt-10 text-center">
          <span className="section-eyebrow">Live Tracking</span>
          <h1 className="text-3xl font-bold mb-3">No trip to track yet</h1>
          <p className="text-midnight-900/60 dark:text-white/60">
            Create a trip from your Dashboard first — once it exists, this page will show only
            <strong> your</strong> route, timeline, expenses and journal for it. No one else's trip
            or location ever appears here.
          </p>
        </section>
      </PageWrapper>
    );
  }

  const mapPoints = points.map((p) => ({
    lat: Number(p.latitude),
    lng: Number(p.longitude),
    label: p.label,
    time: new Date(p.recorded_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  }));

  let totalKm = 0;
  for (let i = 1; i < mapPoints.length; i++) totalKm += distanceKm(mapPoints[i - 1], mapPoints[i]);

  const startedAt = points[0] ? new Date(points[0].recorded_at) : trip.start_date ? new Date(trip.start_date) : null;
  const elapsed = startedAt ? formatElapsed(Date.now() - startedAt.getTime()) : '—';

  return (
    <PageWrapper>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <span className="section-eyebrow">Live Tracking · Only visible to you</span>
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <p className="text-midnight-900/60 dark:text-white/60 text-sm mt-1">
              {trip.destination} · {startedAt ? `Started ${startedAt.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}` : 'Not started yet'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold capitalize ${
              trip.status === 'ongoing' ? 'bg-sunset-500/10 text-sunset-600 dark:text-sunset-400'
              : trip.status === 'completed' ? 'bg-midnight-900/10 text-midnight-900/60 dark:bg-white/10 dark:text-white/60'
              : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${trip.status === 'ongoing' ? 'bg-sunset-500 animate-pulse' : 'bg-current'}`} /> {trip.status}
            </span>
            <button
              onClick={toggleSharing}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                sharing ? 'bg-red-500/10 text-red-500' : 'bg-teal-500 text-white'
              }`}
            >
              {sharing ? <><HiOutlineStop /> Stop sharing</> : <><HiOutlinePlay /> Share my live location</>}
            </button>
            <Link
              to="/memories"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-midnight-900/5 dark:bg-white/10 text-midnight-900/70 dark:text-white/70 hover:bg-teal-500/10"
            >
              <HiOutlineFolderOpen /> Journal & Expenses
            </Link>
          </div>
        </div>
        {geoError && <p className="text-sm text-red-500 mb-6">{geoError}</p>}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Map */}
          <div className="lg:col-span-3">
            {mapPoints.length > 0 ? (
              <LeafletMap points={mapPoints} height={340} className="mb-6" interactive />
            ) : (
              <div className="card p-10 text-center text-midnight-900/50 dark:text-white/50 mb-6">
                No coordinates for this trip yet.
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <p className="text-xl font-display font-bold">{totalKm > 0 ? `${totalKm.toFixed(0)} km` : (trip.distance_km ? `${trip.distance_km} km` : '—')}</p>
                <p className="text-xs text-midnight-900/50 dark:text-white/50">Distance</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xl font-display font-bold">{elapsed}</p>
                <p className="text-xs text-midnight-900/50 dark:text-white/50">Elapsed</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xl font-display font-bold text-teal-500">{trip.eco_score || '—'}{trip.eco_score ? '/100' : ''}</p>
                <p className="text-xs text-midnight-900/50 dark:text-white/50">Eco Score</p>
              </div>
            </div>
          </div>

          {/* Tabs panel */}
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    tab === t.key ? 'bg-teal-500 text-white' : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900/60 dark:text-white/60 hover:bg-teal-500/10'
                  }`}
                >
                  <t.icon /> {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'timeline' && (
                <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-6">
                  {points.length === 0 ? (
                    <p className="text-sm text-midnight-900/50 dark:text-white/50">
                      No timeline events yet — tap "Share my live location" once you set off and each GPS ping will appear here.
                    </p>
                  ) : (
                    <ol className="relative border-l border-midnight-900/10 dark:border-white/10 ml-3 space-y-7">
                      {points.map((p, i) => (
                        <li key={p.id ?? i} className="ml-6">
                          <span className={`absolute -left-[11px] w-5 h-5 rounded-full flex items-center justify-center ${i === points.length - 1 ? 'bg-sunset-500' : 'bg-teal-500'}`}>
                            {i === 0 ? <HiOutlineTruck className="text-white text-[11px]" /> : <HiOutlineCheckCircle className="text-white text-[11px]" />}
                          </span>
                          <p className="text-xs text-midnight-900/40 dark:text-white/40 mb-1">
                            {new Date(p.recorded_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </p>
                          <p className="font-semibold text-sm">{p.label || (i === 0 ? 'Trip started' : 'Location update')}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

// ---------------------------------------------------------------------
// Scripted showcase used only for the logged-out / demo-account view, so
// the marketing preview still looks alive without touching real data.
// ---------------------------------------------------------------------
const DEMO_TIMELINE = [
  { time: '06:00 AM', title: 'Trip started', desc: 'Departed from Delhi via NH334', icon: HiOutlineTruck, done: true },
  { time: '09:15 AM', title: 'Rest stop — Roorkee', desc: 'Breakfast + fuel top-up, 22 min halt', icon: HiOutlineCheckCircle, done: true },
  { time: '11:40 AM', title: 'Ganga Aarti — Haridwar', desc: 'Evening prayer ceremony at Har Ki Pauri', icon: HiOutlineLocationMarker, done: true },
  { time: '01:30 PM', title: 'Arrived — Rishikesh Camp', desc: 'Checked into riverside camp, GPS geofence confirmed', icon: HiOutlineCheckCircle, done: false },
];

function DemoTracking() {
  const [tab, setTab] = useState('timeline');
  return (
    <PageWrapper>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <span className="section-eyebrow">Live Tracking Demo · Sign in to track your own trips</span>
            <h1 className="text-3xl font-bold">Weekend in Rishikesh</h1>
            <p className="text-midnight-900/60 dark:text-white/60 text-sm mt-1">Auto-tracked · Started 06:00 AM · 240 km route</p>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sunset-500/10 text-sunset-600 dark:text-sunset-400 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-sunset-500 animate-pulse" /> Trip in progress
          </span>
        </div>
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <LeafletMap points={ROUTE_LIVE_DEMO} height={340} className="mb-6" interactive />
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center"><p className="text-xl font-display font-bold">240 km</p><p className="text-xs text-midnight-900/50 dark:text-white/50">Distance</p></div>
              <div className="card p-4 text-center"><p className="text-xl font-display font-bold">7h 30m</p><p className="text-xs text-midnight-900/50 dark:text-white/50">Elapsed</p></div>
              <div className="card p-4 text-center"><p className="text-xl font-display font-bold text-teal-500">82/100</p><p className="text-xs text-midnight-900/50 dark:text-white/50">Eco Score</p></div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? 'bg-teal-500 text-white' : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900/60 dark:text-white/60 hover:bg-teal-500/10'}`}>
                  <t.icon /> {t.label}
                </button>
              ))}
            </div>
            {tab === 'timeline' && (
              <div className="card p-6">
                <ol className="relative border-l border-midnight-900/10 dark:border-white/10 ml-3 space-y-7">
                  {DEMO_TIMELINE.map((step, i) => (
                    <li key={i} className="ml-6">
                      <span className={`absolute -left-[11px] w-5 h-5 rounded-full flex items-center justify-center ${step.done ? 'bg-teal-500' : 'bg-midnight-900/20 dark:bg-white/20'}`}>
                        <step.icon className="text-white text-[11px]" />
                      </span>
                      <p className="text-xs text-midnight-900/40 dark:text-white/40 mb-1">{step.time}</p>
                      <p className="font-semibold text-sm">{step.title}</p>
                      <p className="text-sm text-midnight-900/60 dark:text-white/60">{step.desc}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
