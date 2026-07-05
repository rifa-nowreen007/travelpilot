import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineLocationMarker, HiOutlineArrowRight, HiOutlineDownload } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import LeafletMap from '../components/LeafletMap';
import WeatherWidget from '../components/WeatherWidget';
import { exportTripsSummaryPDF } from '../lib/pdfExport';
import { ROUTE_MANALI, ROUTE_RISHIKESH, ROUTE_GOA, ROUTE_JAIPUR } from '../lib/tripRoutes';

const MOCK_TRIPS = [
  { id: 1, title: 'Himalayan Backpacking', destination: 'Manali, Himachal Pradesh', start_date: '2026-08-10', end_date: '2026-08-18', status: 'planned', budget: 25000,
    route: ROUTE_MANALI },
  { id: 2, title: 'Weekend in Rishikesh', destination: 'Rishikesh, Uttarakhand', start_date: '2026-07-18', end_date: '2026-07-20', status: 'ongoing', budget: 9000,
    route: ROUTE_RISHIKESH },
  { id: 3, title: 'Goa Beach Getaway', destination: 'Goa', start_date: '2026-03-05', end_date: '2026-03-09', status: 'completed', budget: 18000,
    route: ROUTE_GOA },
  { id: 4, title: 'Rajasthan Heritage Trip', destination: 'Jaipur, Rajasthan', start_date: '2026-09-15', end_date: '2026-09-22', status: 'planned', budget: 30000,
    route: ROUTE_JAIPUR },
];

const statusColors = {
  planned: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  ongoing: 'bg-sunset-500/10 text-sunset-600 dark:text-sunset-400',
  completed: 'bg-midnight-900/10 text-midnight-900/60 dark:bg-white/10 dark:text-white/60',
  cancelled: 'bg-red-500/10 text-red-500',
};

const FILTERS = ['all', 'planned', 'ongoing', 'completed'];

export default function MyTrips() {
  const { user } = useAuth();
  const isDemo = !user || user.demo;
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [predictForm, setPredictForm] = useState({ destination: '', days: 3 });
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!predictForm.destination) return;
    setPredicting(true);
    setPrediction(null);
    try {
      const { data } = await api.get('/trips/predict-cost', { params: predictForm });
      setPrediction(data.prediction);
    } catch {
      setPrediction(null);
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    async function load() {
      if (isDemo) { setTrips(MOCK_TRIPS); return; }
      try {
        const { data } = await api.get('/trips');
        setTrips(data.trips || []);
      } catch {
        setTrips(MOCK_TRIPS);
      }
    }
    load();
  }, [isDemo]);

  const filtered = trips
    .filter((t) => filter === 'all' || t.status === filter)
    .filter((t) => (t.title + t.destination).toLowerCase().includes(query.toLowerCase()));

  return (
    <PageWrapper>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <span className="section-eyebrow">My Trips</span>
            <h1 className="text-3xl font-bold">Every journey, tracked in one place</h1>
          </div>
          <button
            onClick={() => exportTripsSummaryPDF(filtered)}
            disabled={!filtered.length}
            className="btn-secondary !text-midnight-900 dark:!text-white !bg-midnight-900/5 dark:!bg-white/10 text-sm disabled:opacity-40"
          >
            <HiOutlineDownload /> Export summary PDF
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                filter === f ? 'bg-teal-500 text-white' : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900/60 dark:text-white/60 hover:bg-teal-500/10'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-64">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trips…"
              className="input-field !pl-10"
            />
          </div>
        </div>

        <div className="card p-5 mb-8">
          <p className="font-semibold text-sm mb-1">Predict my budget</p>
          <p className="text-xs text-midnight-900/50 dark:text-white/50 mb-4">
            Estimated from real spending on past trips to similar destinations.
          </p>
          <form onSubmit={handlePredict} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <input
                required
                value={predictForm.destination}
                onChange={(e) => setPredictForm({ ...predictForm, destination: e.target.value })}
                placeholder="Destination e.g. Goa"
                className="input-field"
              />
            </div>
            <div className="w-28">
              <input
                type="number" min="1" required
                value={predictForm.days}
                onChange={(e) => setPredictForm({ ...predictForm, days: e.target.value })}
                placeholder="Days"
                className="input-field"
              />
            </div>
            <button type="submit" disabled={predicting} className="btn-primary !py-2.5 disabled:opacity-60">
              {predicting ? 'Estimating…' : 'Estimate'}
            </button>
          </form>

          {prediction && (
            <div className="mt-5 pt-5 border-t border-midnight-900/10 dark:border-white/10">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  ₹{prediction.predictedTotal.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-midnight-900/50 dark:text-white/50">
                  for {prediction.days} day(s) · ₹{prediction.perDayEstimate.toLocaleString('en-IN')}/day ·{' '}
                  {prediction.basedOnTrips > 0
                    ? `based on ${prediction.basedOnTrips} past trip(s)`
                    : 'general estimate (no matching trip history yet)'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {prediction.breakdown.map((b) => (
                  <span
                    key={b.category}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-midnight-900/5 dark:bg-white/10 capitalize"
                  >
                    {b.category}: ₹{b.amount.toLocaleString('en-IN')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-14 text-center text-midnight-900/50 dark:text-white/50">
            No trips match this filter yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card overflow-hidden group"
              >
                {trip.route && <LeafletMap points={trip.route} height={120} interactive={false} />}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-semibold">{trip.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[trip.status] || statusColors.planned}`}>
                      {trip.status}
                    </span>
                  </div>
                  <p className="text-sm text-midnight-900/60 dark:text-white/60 mb-2 flex items-center gap-1.5">
                    <HiOutlineLocationMarker /> {trip.destination}
                  </p>
                  <div className="mb-3">
                    <WeatherWidget destination={trip.destination} compact />
                  </div>
                  <div className="flex items-center justify-between text-xs text-midnight-900/50 dark:text-white/50 mb-4">
                    <span>{trip.start_date} → {trip.end_date}</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">₹{Number(trip.budget).toLocaleString('en-IN')}</span>
                  </div>
                  {trip.status === 'ongoing' ? (
                    <Link to="/tracking" className="text-sm font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      View live trip <HiOutlineArrowRight />
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-midnight-900/30 dark:text-white/30 flex items-center gap-1">
                      Trip details <HiOutlineArrowRight />
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}
