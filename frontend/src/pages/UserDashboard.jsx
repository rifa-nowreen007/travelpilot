import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiOutlineLocationMarker, HiOutlinePlus, HiOutlineCurrencyRupee,
  HiOutlineShieldExclamation, HiOutlineCamera, HiOutlineX, HiOutlineBookOpen,
  HiOutlineGlobeAlt, HiOutlineClock, HiOutlineArrowRight, HiOutlineTruck,
  HiOutlineCheckCircle, HiOutlineSparkles, HiOutlineTranslate, HiOutlineMap,
  HiOutlineCloud,
} from 'react-icons/hi';
import { FaLeaf } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import StatCard from '../components/StatCard';
import LeafletMap from '../components/LeafletMap';
import ReceiptScanner from '../components/ReceiptScanner';
import { ROUTE_MANALI, ROUTE_RISHIKESH, ROUTE_GOA, ROUTE_LIVE_DEMO } from '../lib/tripRoutes';

const MOCK_TRIPS = [
  { id: 1, title: 'Himalayan Backpacking', destination: 'Manali, Himachal Pradesh', start_date: '2026-08-10', end_date: '2026-08-18', status: 'planned', budget: 25000, distance_km: 570, eco_score: 78,
    route: ROUTE_MANALI },
  { id: 2, title: 'Weekend in Rishikesh', destination: 'Rishikesh, Uttarakhand', start_date: '2026-07-18', end_date: '2026-07-20', status: 'ongoing', budget: 9000, distance_km: 240, eco_score: 82,
    route: ROUTE_RISHIKESH },
  { id: 3, title: 'Goa Beach Getaway', destination: 'Goa', start_date: '2026-03-05', end_date: '2026-03-09', status: 'completed', budget: 18000, distance_km: 620, eco_score: 54,
    route: ROUTE_GOA },
];

const LIVE_TIMELINE = [
  { time: '06:00 AM', title: 'Trip started', desc: 'Departed Delhi via NH334', icon: HiOutlineTruck, done: true },
  { time: '09:15 AM', title: 'Rest stop — Roorkee', desc: 'Breakfast + fuel, 22 min halt', icon: HiOutlineCheckCircle, done: true },
  { time: '11:40 AM', title: 'Ganga Aarti — Haridwar', desc: 'Evening prayer at Har Ki Pauri', icon: HiOutlineLocationMarker, done: true },
  { time: '01:30 PM', title: 'Arrived — Rishikesh Camp', desc: 'Riverside camp, geofence confirmed', icon: HiOutlineCheckCircle, done: false },
];

const QUICK_FEATURES = [
  { icon: HiOutlineShieldExclamation, title: 'Panic Button & Geofencing', desc: 'One-tap SOS with live location shared to emergency contacts and nearby authorities.', color: 'sunset' },
  { icon: HiOutlineSparkles, title: 'AI Trip Assistant', desc: 'Gemini-powered chat for itineraries, packing lists, budgets and safety tips.', color: 'teal' },
  { icon: HiOutlineCamera, title: 'OCR Expense Scanning', desc: 'Snap a receipt and auto-log the amount, category and merchant.', color: 'teal' },
  { icon: HiOutlineMap, title: 'Live Route Tracking', desc: 'Auto-tracked journeys on OpenStreetMap with a timestamped timeline.', color: 'sunset' },
  { icon: HiOutlineTranslate, title: 'Multilingual Support', desc: 'Explore and get help in your preferred regional language.', color: 'teal' },
  { icon: HiOutlineCloud, title: 'Offline-First Sync', desc: 'Log expenses and journal entries offline — sync resumes automatically.', color: 'sunset' },
];

const MOCK_EXPENSES = [
  { id: 1, category: 'transport', amount: 3500, description: 'Volvo bus tickets', expense_date: '2026-08-10' },
  { id: 2, category: 'stay', amount: 6000, description: 'Hostel booking', expense_date: '2026-08-10' },
  { id: 3, category: 'food', amount: 1200, description: 'Local dhaba meals', expense_date: '2026-08-11' },
];

const MOCK_ACTIVITY = [
  { id: 1, type: 'trip', label: 'Weekend in Rishikesh marked as ongoing', meta: 'ongoing', created_at: '2026-07-18T09:00:00' },
  { id: 2, type: 'expense', label: 'Local dhaba meals', meta: '₹1,200', created_at: '2026-08-11T13:20:00' },
  { id: 3, type: 'journal', label: 'Sunset at Baga Beach', meta: 'relaxed', created_at: '2026-03-06T18:40:00' },
  { id: 4, type: 'expense', label: 'Hostel booking - 4 nights', meta: '₹6,000', created_at: '2026-08-10T11:05:00' },
  { id: 5, type: 'sos', label: 'Lost network near backwaters', meta: 'resolved', created_at: '2026-06-02T15:30:00' },
];

const statusColors = {
  planned: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  ongoing: 'bg-sunset-500/10 text-sunset-600 dark:text-sunset-400',
  completed: 'bg-midnight-900/10 text-midnight-900/60 dark:bg-white/10 dark:text-white/60',
  cancelled: 'bg-red-500/10 text-red-500',
};

const activityIcon = { trip: HiOutlineLocationMarker, expense: HiOutlineCurrencyRupee, journal: HiOutlineBookOpen, sos: HiOutlineShieldExclamation };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const isDemo = !user || user.demo;

  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ tripId: '', description: '', amount: '', category: 'other', receiptImage: null });
  const [sosActive, setSosActive] = useState(false);
  const [form, setForm] = useState({ title: '', destination: '', startDate: '', endDate: '', budget: '' });

  useEffect(() => {
    async function load() {
      if (isDemo) {
        setTrips(MOCK_TRIPS);
        setExpenses(MOCK_EXPENSES);
        setActivity(MOCK_ACTIVITY);
        setLoading(false);
        return;
      }
      try {
        const [t, a, ex] = await Promise.all([api.get('/trips'), api.get('/activity'), api.get('/expenses/mine')]);
        setTrips(t.data.trips || []);
        setActivity(a.data.activity || []);
        setExpenses(ex.data.expenses || []);
      } catch {
        setTrips(MOCK_TRIPS);
        setActivity(MOCK_ACTIVITY);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isDemo]);

  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalDistance = trips.reduce((sum, t) => sum + Number(t.distance_km || 0), 0);
  const avgEco = trips.length ? Math.round(trips.reduce((s, t) => s + Number(t.eco_score || 0), 0) / trips.length) : 0;
  const activeTrip = trips.find((t) => t.status === 'ongoing');

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (isDemo) {
      setTrips([{ id: Date.now(), ...form, status: 'planned', budget: Number(form.budget) || 0, start_date: form.startDate, end_date: form.endDate, distance_km: 0, eco_score: 65, route: [{ x: 15, y: 40, label: 'Start' }, { x: 85, y: 20, label: form.destination.split(',')[0] }] }, ...trips]);
      setShowModal(false);
      setForm({ title: '', destination: '', startDate: '', endDate: '', budget: '' });
      return;
    }
    try {
      const { data } = await api.post('/trips', form);
      setTrips([data.trip, ...trips]);
      setShowModal(false);
      setForm({ title: '', destination: '', startDate: '', endDate: '', budget: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create trip');
    }
  };

  const openExpenseModal = () => {
    if (isDemo) { alert('Sign in to log real expenses.'); return; }
    if (!trips.length) { alert('Create a trip first, then you can log expenses against it.'); return; }
    setExpenseForm({ tripId: activeTrip?.id || trips[0].id, description: '', amount: '', category: 'other', receiptImage: null });
    setShowExpenseModal(true);
  };

  const handleScannedReceipt = (result) => {
    setExpenseForm((f) => ({
      ...f,
      description: result.merchant || f.description,
      amount: result.amount ? String(result.amount) : f.amount,
      category: result.category || f.category,
      receiptImage: result.receiptImage || f.receiptImage,
    }));
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.tripId || !expenseForm.amount) return;
    try {
      const { data } = await api.post('/expenses', {
        tripId: expenseForm.tripId,
        description: expenseForm.description || expenseForm.category,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        expenseDate: new Date().toISOString().slice(0, 10),
        isOcrScanned: !!expenseForm.receiptImage,
        receiptImage: expenseForm.receiptImage,
      });
      setExpenses([data.expense, ...expenses]);
      setShowExpenseModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleSos = () => {
    if (isDemo) {
      setSosActive(true);
      setTimeout(() => setSosActive(false), 4000);
      return;
    }
    setSosActive(true);
    const trigger = (coords) => {
      api
        .post('/safety/sos', { lat: coords?.latitude ?? null, lng: coords?.longitude ?? null, message: 'Emergency SOS triggered from Dashboard' })
        .then(({ data }) => {
          const notified = data.notified?.filter((n) => n.ok).length || 0;
          alert(notified ? `SOS sent — ${notified} contact(s) notified.` : 'SOS logged. Add emergency contacts on the Safety page so someone actually gets alerted next time.');
        })
        .catch(() => alert('Failed to send SOS — check your connection and try again.'))
        .finally(() => setTimeout(() => setSosActive(false), 4000));
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => trigger(pos.coords), () => trigger(null), { timeout: 5000 });
    } else {
      trigger(null);
    }
  };

  const quickActions = [
    { label: 'New Trip', icon: HiOutlineLocationMarker, onClick: () => setShowModal(true), color: 'teal' },
    { label: 'Itinerary', icon: HiOutlineBookOpen, to: '/itinerary', color: 'teal' },
    { label: 'Group Trip', icon: HiOutlineGlobeAlt, to: '/group', color: 'teal' },
    { label: 'SOS', icon: HiOutlineShieldExclamation, onClick: handleSos, color: 'sunset' },
  ];

  return (
    <PageWrapper>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <span className="section-eyebrow">My Dashboard</span>
            <h1 className="text-3xl font-bold">Hi, {user?.name?.split(' ')[0] || 'Traveller'} 👋</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSos} className="btn-accent">
              <HiOutlineShieldExclamation /> SOS
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <HiOutlinePlus /> New Trip
            </button>
          </div>
        </div>

        {isDemo && (
          <div className="mb-6 text-sm px-4 py-3 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
            Preview mode — showing sample data since no account is signed in yet.
          </div>
        )}

        {sosActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 px-5 py-4 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 font-medium"
          >
            <HiOutlineShieldExclamation className="text-xl animate-pulse" />
            SOS sent — your live location has been shared with your emergency contacts.
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {quickActions.map((qa, i) => {
            const content = (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card p-5 flex flex-col items-center text-center gap-2 cursor-pointer hover:-translate-y-1 transition-transform"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${qa.color === 'sunset' ? 'bg-sunset-500/10 text-sunset-500' : 'bg-teal-500/10 text-teal-500'}`}>
                  <qa.icon className="text-xl" />
                </div>
                <span className="text-sm font-semibold">{qa.label}</span>
              </motion.div>
            );
            return qa.to ? (
              <Link key={qa.label} to={qa.to}>{content}</Link>
            ) : (
              <button key={qa.label} onClick={qa.onClick} className="w-full">{content}</button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <StatCard icon={HiOutlineLocationMarker} label="Total Trips" value={trips.length} sub={activeTrip ? '1 ongoing now' : undefined} delay={0} />
          <StatCard icon={HiOutlineCurrencyRupee} label="Total Expenses Logged" value={`₹${totalSpend.toLocaleString('en-IN')}`} color="sunset" delay={0.05} />
          <StatCard icon={HiOutlineGlobeAlt} label="Distance Traveled" value={`${totalDistance.toLocaleString('en-IN')} km`} delay={0.1} />
          <StatCard icon={FaLeaf} label="Eco Score (avg)" value={`${avgEco}/100`} sub={avgEco >= 70 ? 'Great eco footprint' : undefined} color="sunset" delay={0.15} />
        </div>

        {/* Live Tracking Section */}
        <div className="mb-14">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <HiOutlineMap className="text-teal-500" /> Live Tracking
            </h2>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sunset-500/10 text-sunset-600 dark:text-sunset-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-sunset-500 animate-pulse" /> In progress
              </span>
              <Link to="/tracking" className="text-sm text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                Full view <HiOutlineArrowRight />
              </Link>
            </div>
          </div>
          <div className="card overflow-hidden grid lg:grid-cols-5">
            <div className="lg:col-span-3">
              <LeafletMap points={ROUTE_LIVE_DEMO} height={320} interactive className="rounded-none" />
            </div>
            <div className="lg:col-span-2 p-6">
              <p className="text-xs uppercase tracking-wide text-midnight-900/40 dark:text-white/40 font-semibold mb-4">
                Weekend in Rishikesh · 240 km
              </p>
              <ol className="relative border-l border-midnight-900/10 dark:border-white/10 ml-3 space-y-5">
                {LIVE_TIMELINE.map((step, i) => (
                  <li key={i} className="ml-5">
                    <span className={`absolute -left-[9px] w-4 h-4 rounded-full flex items-center justify-center ${step.done ? 'bg-teal-500' : 'bg-midnight-900/20 dark:bg-white/20'}`}>
                      <step.icon className="text-white text-[9px]" />
                    </span>
                    <p className="text-[11px] text-midnight-900/40 dark:text-white/40">{step.time}</p>
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="text-xs text-midnight-900/60 dark:text-white/60">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Trips */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <HiOutlineLocationMarker className="text-teal-500" /> Your Trips
              </h2>
              <Link to="/my-trips" className="text-sm text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                View all <HiOutlineArrowRight />
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-midnight-900/50 dark:text-white/50">Loading trips…</p>
            ) : trips.length === 0 ? (
              <div className="card p-10 text-center text-midnight-900/50 dark:text-white/50">
                No trips yet — create your first one to see it tracked here.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5 mb-14">
                {trips.slice(0, 4).map((trip) => (
                  <div key={trip.id} className="card overflow-hidden">
                    {trip.route && <LeafletMap points={trip.route} height={110} interactive={false} />}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-display font-semibold">{trip.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[trip.status] || statusColors.planned}`}>
                          {trip.status}
                        </span>
                      </div>
                      <p className="text-sm text-midnight-900/60 dark:text-white/60 mb-3 flex items-center gap-1.5">
                        <HiOutlineLocationMarker /> {trip.destination}
                      </p>
                      <div className="flex items-center justify-between text-xs text-midnight-900/50 dark:text-white/50">
                        <span>{trip.start_date} → {trip.end_date}</span>
                        <span className="font-semibold text-teal-600 dark:text-teal-400">₹{Number(trip.budget).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Expenses */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <HiOutlineCurrencyRupee className="text-teal-500" /> Recent Expenses
              </h2>
              <button onClick={openExpenseModal} className="text-sm text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                <HiOutlineCamera /> Scan Receipt
              </button>
            </div>
            <div className="card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-midnight-900/5 dark:bg-white/5 text-left">
                  <tr>
                    <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Description</th>
                    <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Category</th>
                    <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Date</th>
                    <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-t border-midnight-900/5 dark:border-white/5">
                      <td className="px-5 py-3">{e.description}</td>
                      <td className="px-5 py-3 capitalize text-midnight-900/60 dark:text-white/60">{e.category}</td>
                      <td className="px-5 py-3 text-midnight-900/60 dark:text-white/60">{e.expense_date}</td>
                      <td className="px-5 py-3 text-right font-semibold">₹{Number(e.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity feed */}
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-5">
              <HiOutlineClock className="text-teal-500" /> Recent Activity
            </h2>
            <div className="card p-2">
              {activity.map((a, i) => {
                const Icon = activityIcon[a.type] || HiOutlineClock;
                return (
                  <div key={a.id ?? i} className={`flex items-start gap-3 px-4 py-3 ${i !== activity.length - 1 ? 'border-b border-midnight-900/5 dark:border-white/5' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="text-sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.label}</p>
                      <p className="text-xs text-midnight-900/50 dark:text-white/50 capitalize">{a.meta} · {timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Features Showcase */}
        <div className="mt-16">
          <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-6">
            <HiOutlineSparkles className="text-teal-500" /> Quick Features Showcase
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {QUICK_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card p-5"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color === 'sunset' ? 'bg-sunset-500/10 text-sunset-500' : 'bg-teal-500/10 text-teal-500'}`}>
                  <f.icon className="text-xl" />
                </div>
                <h3 className="font-display font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-midnight-900/60 dark:text-white/60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Trip Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-midnight-950/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="card w-full max-w-md p-7 relative"
          >
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-midnight-900/40 dark:text-white/40 hover:text-red-500">
              <HiOutlineX className="text-xl" />
            </button>
            <h3 className="font-display text-xl font-bold mb-6">Plan a new trip</h3>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <input required placeholder="Trip title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
              <input required placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="input-field" />
              <div className="grid grid-cols-2 gap-3">
                <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
                <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
              </div>
              <input type="number" min="0" placeholder="Budget (₹)" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="input-field" />
              <button type="submit" className="btn-primary w-full">Create Trip</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Scan Receipt / Quick-add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card w-full max-w-md p-7 relative"
          >
            <button onClick={() => setShowExpenseModal(false)} className="absolute top-5 right-5 text-midnight-900/40 dark:text-white/40 hover:text-red-500">
              <HiOutlineX className="text-xl" />
            </button>
            <h3 className="font-display text-xl font-bold mb-2">Add an expense</h3>
            <ReceiptScanner
              label="Scan a receipt to auto-fill"
              onScanned={handleScannedReceipt}
              className="mb-5"
            />
            {expenseForm.receiptImage && (
              <p className="text-xs text-teal-600 dark:text-teal-400 mb-4 flex items-center gap-1">
                <HiOutlineCurrencyRupee /> Receipt photo saved with this expense
              </p>
            )}
            <form onSubmit={handleAddExpense} className="space-y-4">
              {trips.length > 1 && (
                <select value={expenseForm.tripId} onChange={(e) => setExpenseForm({ ...expenseForm, tripId: Number(e.target.value) })} className="input-field">
                  {trips.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              )}
              <input placeholder="Description / merchant" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} className="input-field" />
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" min="0" placeholder="Amount (₹)" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="input-field" />
                <select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="input-field">
                  {['food', 'transport', 'stay', 'shopping', 'activities', 'other'].map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">Add Expense</button>
            </form>
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
}
