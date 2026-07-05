import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlineDownload, HiOutlineSparkles,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import { exportPackingListPDF } from '../lib/pdfExport';

const TEMPLATE_LABELS = {
  general: 'General',
  beach: 'Beach',
  trekking: 'Trekking',
  business: 'Business',
  winter: 'Winter',
};

const CATEGORIES = ['clothing', 'toiletries', 'electronics', 'documents', 'health', 'misc'];

export default function PackingChecklist() {
  const { user } = useAuth();
  const isDemo = !user || user.demo;

  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState('');
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ itemName: '', category: 'misc', quantity: 1 });

  // Load the user's trips so they can pick which one this list belongs to.
  useEffect(() => {
    if (isDemo) return;
    api.get('/trips').then(({ data }) => {
      setTrips(data.trips || []);
      if (data.trips?.length) setTripId(String(data.trips[0].id));
    }).catch(() => {});
  }, [isDemo]);

  const loadItems = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/packing/trip/${id}`);
      setItems(data.items || []);
      setProgress(data.progress || 0);
    } catch {
      setItems([]);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (tripId) loadItems(tripId); }, [tripId]);

  const applyTemplate = async (templateName) => {
    if (!tripId) return;
    await api.post('/packing/template', { tripId, templateName });
    loadItems(tripId);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.itemName || !tripId) return;
    await api.post('/packing', { tripId, ...form });
    setForm({ itemName: '', category: 'misc', quantity: 1 });
    loadItems(tripId);
  };

  const toggleItem = async (id) => {
    // Optimistic update so checking a box feels instant.
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_packed: !it.is_packed } : it)));
    await api.patch(`/packing/${id}/toggle`);
    loadItems(tripId);
  };

  const removeItem = async (id) => {
    await api.delete(`/packing/${id}`);
    loadItems(tripId);
  };

  const currentTrip = trips.find((t) => String(t.id) === String(tripId));
  const byCategory = CATEGORIES.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length);

  if (isDemo) {
    return (
      <PageWrapper>
        <section className="max-w-3xl mx-auto px-6 lg:px-8 pb-24 text-center">
          <span className="section-eyebrow">Packing Checklist</span>
          <h1 className="text-3xl font-bold mb-3">Log in to build your packing list</h1>
          <p className="text-midnight-900/60 dark:text-white/60">
            Packing checklists are saved per trip once you're signed in.
          </p>
        </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <section className="max-w-4xl mx-auto px-6 lg:px-8 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <span className="section-eyebrow">Never forget an essential</span>
            <h1 className="text-3xl font-bold">Packing Checklist</h1>
          </div>
          <button
            onClick={() => currentTrip && exportPackingListPDF({ tripTitle: currentTrip.title, items })}
            disabled={!items.length}
            className="btn-secondary !text-midnight-900 dark:!text-white !bg-midnight-900/5 dark:!bg-white/10 text-sm disabled:opacity-40"
          >
            <HiOutlineDownload /> Export PDF
          </button>
        </div>

        {/* Trip selector */}
        <div className="card p-5 mb-6">
          <label className="text-xs font-medium text-midnight-900/50 dark:text-white/50 mb-1.5 block">
            Packing list for trip
          </label>
          <select value={tripId} onChange={(e) => setTripId(e.target.value)} className="input-field">
            {!trips.length && <option value="">No trips yet — create one first</option>}
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.title} — {t.destination}</option>
            ))}
          </select>
        </div>

        {tripId && (
          <>
            {/* Progress bar */}
            <div className="card p-5 mb-6">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="font-medium">Packing progress</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-midnight-900/10 dark:bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Templates */}
            <div className="card p-5 mb-6">
              <p className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                <HiOutlineSparkles className="text-teal-500" /> Quick-add a starter template
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => applyTemplate(key)}
                    className="px-4 py-2 rounded-full text-xs font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add item form */}
            <form onSubmit={handleAdd} className="card p-5 mb-6 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[160px]">
                <input
                  required
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  placeholder="Item name"
                  className="input-field"
                />
              </div>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field w-40">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number" min="1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input-field w-20"
              />
              <button type="submit" className="btn-primary !py-2.5">
                <HiOutlinePlus /> Add
              </button>
            </form>

            {/* Checklist */}
            {loading ? (
              <div className="card p-10 text-center text-midnight-900/50 dark:text-white/50">Loading…</div>
            ) : !items.length ? (
              <div className="card p-10 text-center text-midnight-900/50 dark:text-white/50">
                No items yet — apply a template above or add your own.
              </div>
            ) : (
              <div className="space-y-6">
                {byCategory.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-midnight-900/40 dark:text-white/40 mb-2">
                      {group.category}
                    </h3>
                    <div className="card divide-y divide-midnight-900/5 dark:divide-white/5">
                      <AnimatePresence>
                        {group.items.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-3 px-5 py-3"
                          >
                            <input
                              type="checkbox"
                              checked={!!item.is_packed}
                              onChange={() => toggleItem(item.id)}
                              className="w-4 h-4 accent-teal-500"
                            />
                            <span className={`flex-1 text-sm ${item.is_packed ? 'line-through text-midnight-900/40 dark:text-white/40' : ''}`}>
                              {item.item_name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}
                            </span>
                            <button onClick={() => removeItem(item.id)} className="text-midnight-900/30 dark:text-white/30 hover:text-red-500">
                              <HiOutlineTrash />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </PageWrapper>
  );
}
