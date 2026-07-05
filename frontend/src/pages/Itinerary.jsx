import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus, HiOutlineClock, HiOutlineLocationMarker, HiOutlineTrash,
  HiOutlineSparkles, HiOutlineCurrencyRupee, HiOutlineX, HiOutlineDownload,
} from 'react-icons/hi';
import { FaLeaf } from 'react-icons/fa';
import PageWrapper from '../components/PageWrapper';
import WeatherWidget from '../components/WeatherWidget';
import { exportItineraryPDF } from '../lib/pdfExport';

const STARTER_PLAN = {
  1: [
    { id: 1, time: '07:00 AM', place: 'Har Ki Pauri, Haridwar', activity: 'Morning Ganga Aarti', tier: 'budget', eco: true },
    { id: 2, time: '11:00 AM', place: 'Rishikesh', activity: 'River rafting (Grade II-III)', tier: 'luxury', eco: false },
    { id: 3, time: '06:30 PM', place: 'Triveni Ghat', activity: 'Evening aarti + street food', tier: 'budget', eco: true },
  ],
  2: [
    { id: 4, time: '08:00 AM', place: 'Neelkanth Mahadev', activity: 'Trek + temple visit', tier: 'budget', eco: true },
  ],
};

const TIER_STYLES = {
  budget: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  luxury: 'bg-sunset-500/10 text-sunset-600 dark:text-sunset-400',
};

export default function Itinerary() {
  const [plan, setPlan] = useState(STARTER_PLAN);
  const [activeDay, setActiveDay] = useState(1);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ time: '', place: '', activity: '', tier: 'budget', eco: false });
  const [destination, setDestination] = useState('Rishikesh, Uttarakhand');

  const days = Object.keys(plan).map(Number).sort((a, b) => a - b);

  const addDay = () => {
    const next = (days[days.length - 1] || 0) + 1;
    setPlan({ ...plan, [next]: [] });
    setActiveDay(next);
  };

  const removeStop = (day, id) => {
    setPlan({ ...plan, [day]: plan[day].filter((s) => s.id !== id) });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.time || !form.place || !form.activity) return;
    const stop = { id: Date.now(), ...form };
    const list = [...(plan[activeDay] || []), stop].sort((a, b) => a.time.localeCompare(b.time));
    setPlan({ ...plan, [activeDay]: list });
    setForm({ time: '', place: '', activity: '', tier: 'budget', eco: false });
    setShowModal(false);
  };

  const stops = (plan[activeDay] || []).filter((s) => filter === 'all' || s.tier === filter);
  const dayBudgetEstimate = stops.reduce((sum, s) => sum + (s.tier === 'luxury' ? 3500 : 900), 0);

  return (
    <PageWrapper>
      <section className="max-w-5xl mx-auto px-6 lg:px-8 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <span className="section-eyebrow">Plan your days</span>
            <h1 className="text-3xl font-bold">Itinerary Planner</h1>
            <p className="text-midnight-900/60 dark:text-white/60 text-sm mt-1">
              Add places, timings and activities for each day of your trip.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportItineraryPDF({ tripTitle: destination, destination, plan })}
              className="btn-secondary !text-midnight-900 dark:!text-white !bg-midnight-900/5 dark:!bg-white/10 text-sm"
            >
              <HiOutlineDownload /> Export PDF
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <HiOutlinePlus /> Add stop
            </button>
          </div>
        </div>

        {/* Destination + live weather for the trip */}
        <div className="grid md:grid-cols-[1fr,320px] gap-4 mb-8 items-start">
          <div>
            <label className="text-xs font-medium text-midnight-900/50 dark:text-white/50 mb-1.5 block">
              Trip destination (used for weather + PDF title)
            </label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Manali, Himachal Pradesh"
              className="input-field"
            />
          </div>
          <WeatherWidget destination={destination} />
        </div>

        {/* Day tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeDay === d ? 'bg-teal-500 text-white' : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900/60 dark:text-white/60 hover:bg-teal-500/10'
              }`}
            >
              Day {d}
            </button>
          ))}
          <button onClick={addDay} className="px-4 py-2.5 rounded-full text-sm font-medium border border-dashed border-midnight-900/20 dark:border-white/20 text-midnight-900/50 dark:text-white/50 hover:border-teal-500 hover:text-teal-500 whitespace-nowrap">
            <HiOutlinePlus className="inline -mt-0.5" /> Day
          </button>
        </div>

        {/* Budget vs Luxury filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {['all', 'budget', 'luxury'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-colors ${
                  filter === t ? 'bg-midnight-900 text-white dark:bg-white dark:text-midnight-900' : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900/60 dark:text-white/60'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400">
            <HiOutlineCurrencyRupee /> Est. Day {activeDay}: ₹{dayBudgetEstimate.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Timeline */}
        {stops.length === 0 ? (
          <div className="card p-10 text-center text-midnight-900/50 dark:text-white/50">
            No stops for this day yet — add one to build your itinerary.
          </div>
        ) : (
          <ol className="relative border-l border-midnight-900/10 dark:border-white/10 ml-3 space-y-6">
            <AnimatePresence>
              {stops.map((s) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-6"
                >
                  <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-teal-500 border-2 border-white dark:border-midnight-950" />
                  <div className="card p-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-midnight-900/40 dark:text-white/40 mb-1 flex items-center gap-1.5">
                        <HiOutlineClock /> {s.time}
                      </p>
                      <p className="font-semibold text-sm flex items-center gap-1.5">
                        <HiOutlineLocationMarker className="text-teal-500" /> {s.place}
                      </p>
                      <p className="text-sm text-midnight-900/60 dark:text-white/60 mt-1">{s.activity}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${TIER_STYLES[s.tier]}`}>{s.tier}</span>
                        {s.eco && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1">
                            <FaLeaf className="text-[10px]" /> Eco-friendly
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeStop(activeDay, s.id)} className="text-midnight-900/30 dark:text-white/30 hover:text-red-500 transition-colors flex-shrink-0">
                      <HiOutlineTrash />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}

        <div className="card p-6 mt-10 flex items-start gap-4 bg-teal-500/5">
          <HiOutlineSparkles className="text-2xl text-teal-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm mb-1">Want a plan generated for you?</p>
            <p className="text-sm text-midnight-900/60 dark:text-white/60">
              Head to the AI Assistant and describe your destination, days and budget — it'll draft a day-by-day plan you can drop straight into this planner.
            </p>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-midnight-950/60 backdrop-blur-sm px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-md p-7 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-midnight-900/40 dark:text-white/40 hover:text-red-500">
              <HiOutlineX className="text-xl" />
            </button>
            <h3 className="font-display text-xl font-bold mb-6">Add a stop — Day {activeDay}</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="input-field" />
              <input required placeholder="Place" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className="input-field" />
              <input required placeholder="Activity" value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} className="input-field" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className="input-field">
                  <option value="budget">Budget</option>
                  <option value="luxury">Luxury</option>
                </select>
                <label className="flex items-center gap-2 px-4 rounded-xl border border-midnight-900/10 dark:border-white/10 text-sm">
                  <input type="checkbox" checked={form.eco} onChange={(e) => setForm({ ...form, eco: e.target.checked })} />
                  Eco-friendly
                </label>
              </div>
              <button type="submit" className="btn-primary w-full">Add to itinerary</button>
            </form>
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
}
