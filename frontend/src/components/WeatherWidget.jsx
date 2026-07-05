import { useEffect, useState } from 'react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import api from '../api/axios';

// Compact weather card for a destination — current conditions plus a
// short forecast strip. Backed by the free, key-less /api/weather route
// (Open-Meteo under the hood), so this just needs a destination string.
export default function WeatherWidget({ destination, compact = false }) {
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    setStatus('loading');
    api
      .get('/weather', { params: { destination } })
      .then(({ data }) => {
        if (cancelled) return;
        setWeather(data.weather);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [destination]);

  if (status === 'loading') {
    return (
      <div className={`flex items-center gap-2 text-xs text-midnight-900/40 dark:text-white/40 ${compact ? '' : 'p-4'}`}>
        <span className="animate-pulse">Loading weather…</span>
      </div>
    );
  }

  if (status === 'error' || !weather) {
    return (
      <div className="flex items-center gap-2 text-xs text-midnight-900/40 dark:text-white/40">
        <HiOutlineExclamationCircle /> Weather unavailable
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-midnight-900/70 dark:text-white/70">
        <span className="text-base leading-none">{weather.current.icon}</span>
        {weather.current.temp}°C · {weather.current.label}
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-midnight-900/50 dark:text-white/50">Weather in</p>
          <p className="font-semibold">{destination}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl">{weather.current.icon}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold">{weather.current.temp}°C</span>
        <span className="text-sm text-midnight-900/60 dark:text-white/60">{weather.current.label}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {weather.daily.slice(0, 5).map((d) => (
          <div key={d.date} className="flex-shrink-0 w-16 text-center bg-midnight-900/5 dark:bg-white/5 rounded-xl py-2">
            <p className="text-[10px] text-midnight-900/50 dark:text-white/50 mb-1">
              {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
            </p>
            <p className="text-lg leading-none mb-1">{d.icon}</p>
            <p className="text-[11px] font-medium">{d.tempMax}°/{d.tempMin}°</p>
          </div>
        ))}
      </div>
    </div>
  );
}
