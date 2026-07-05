import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineSparkles, HiOutlineX, HiOutlineLocationMarker, HiOutlineCalendar,
  HiOutlineCurrencyRupee, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineHeart,
  HiOutlineFolder, HiOutlineFolderOpen, HiOutlineBookOpen, HiOutlineCamera,
  HiOutlineTrash, HiOutlineArrowLeft,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import PhotoUploader from '../components/PhotoUploader';

const SLIDE_MS = 5000;

function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export default function Memories() {
  const { user } = useAuth();
  const isDemo = !user || user.demo;

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTripId, setActiveTripId] = useState(null); // trip currently in "story mode"
  const [slides, setSlides] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const timerRef = useRef(null);

  // Per-trip "folder" — opened from a trip card, holds that trip's journal
  // entries and expenses in one place instead of scattering them across
  // other pages.
  const [folderTrip, setFolderTrip] = useState(null);
  const [folderTab, setFolderTab] = useState('journal'); // 'journal' | 'expenses'
  const [folderLoading, setFolderLoading] = useState(false);
  const [folderJournal, setFolderJournal] = useState([]);
  const [folderExpenses, setFolderExpenses] = useState({ expenses: [], total: 0 });
  const [journalForm, setJournalForm] = useState({ title: '', content: '', mood: 'happy', photoUrl: null });

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    api.get('/trips').then(({ data }) => setTrips(data.trips || [])).finally(() => setLoading(false));
  }, [isDemo]);

  async function openFolder(trip) {
    setFolderTrip(trip);
    setFolderTab('journal');
    setFolderLoading(true);
    try {
      const [journalRes, expenseRes] = await Promise.all([
        api.get(`/journals/trip/${trip.id}`).catch(() => ({ data: { journals: [] } })),
        api.get(`/expenses/trip/${trip.id}`).catch(() => ({ data: { expenses: [], total: 0 } })),
      ]);
      setFolderJournal(journalRes.data.journals || []);
      setFolderExpenses({
        expenses: expenseRes.data.expenses || [],
        total: expenseRes.data.total ?? (expenseRes.data.expenses || []).reduce((s, e) => s + Number(e.amount), 0),
      });
    } finally {
      setFolderLoading(false);
    }
  }

  function closeFolder() {
    setFolderTrip(null);
    setFolderJournal([]);
    setFolderExpenses({ expenses: [], total: 0 });
    setJournalForm({ title: '', content: '', mood: 'happy', photoUrl: null });
  }

  async function submitJournal(e) {
    e.preventDefault();
    if (!journalForm.title.trim() || !journalForm.content.trim() || !folderTrip) return;
    try {
      await api.post('/journals', {
        tripId: folderTrip.id,
        title: journalForm.title,
        content: journalForm.content,
        mood: journalForm.mood,
        entryDate: new Date().toISOString().slice(0, 10),
        photoUrl: journalForm.photoUrl,
      });
      setJournalForm({ title: '', content: '', mood: 'happy', photoUrl: null });
      const { data } = await api.get(`/journals/trip/${folderTrip.id}`);
      setFolderJournal(data.journals || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save memory');
    }
  }

  async function deleteJournalEntry(id) {
    try {
      await api.delete(`/journals/${id}`);
      setFolderJournal((prev) => prev.filter((j) => j.id !== id));
    } catch {
      /* no-op */
    }
  }

  async function openRecap(trip) {
    setPreparing(true);
    try {
      const [routeRes, journalRes, expenseRes] = await Promise.all([
        api.get(`/routes/${trip.id}`).catch(() => ({ data: { points: [] } })),
        api.get(`/journals/trip/${trip.id}`).catch(() => ({ data: { journals: [] } })),
        api.get(`/expenses/trip/${trip.id}`).catch(() => ({ data: { total: 0 } })),
      ]);
      const points = routeRes.data.points || [];
      let km = 0;
      for (let i = 1; i < points.length; i++) {
        km += distanceKm(
          { lat: Number(points[i - 1].latitude), lng: Number(points[i - 1].longitude) },
          { lat: Number(points[i].latitude), lng: Number(points[i].longitude) }
        );
      }
      const journals = journalRes.data.journals || [];
      const total = Number(expenseRes.data.total || 0);
      const days = daysBetween(trip.start_date, trip.end_date);

      const built = [
        { type: 'cover', trip },
        { type: 'stats', trip, km: Math.round(km), days, total },
        ...journals.map((j) => ({ type: 'memory', journal: j })),
        { type: 'closing', trip },
      ];
      setSlides(built);
      setSlideIndex(0);
      setActiveTripId(trip.id);
    } finally {
      setPreparing(false);
    }
  }

  const closeRecap = () => {
    setActiveTripId(null);
    setSlides([]);
    clearTimeout(timerRef.current);
  };

  const next = () => setSlideIndex((i) => Math.min(i + 1, slides.length - 1));
  const prev = () => setSlideIndex((i) => Math.max(i - 1, 0));

  // Auto-advance, like Instagram/Snapchat stories. Stops at the last slide
  // rather than looping, so it doesn't feel like it's stuck.
  useEffect(() => {
    if (!activeTripId) return;
    clearTimeout(timerRef.current);
    if (slideIndex >= slides.length - 1) return;
    timerRef.current = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIndex, activeTripId]);

  if (isDemo) {
    return (
      <PageWrapper>
        <section className="max-w-3xl mx-auto px-6 lg:px-8 pb-24 pt-10 text-center">
          <span className="section-eyebrow">Trip memories</span>
          <h1 className="text-3xl font-bold mb-3">Memory Timeline</h1>
          <p className="text-midnight-900/60 dark:text-white/60">
            Sign in and complete a trip to unlock an auto-generated, story-style recap of your journey —
            distance covered, days on the road, spend, and every memory you logged along the way.
          </p>
        </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <section className="max-w-5xl mx-auto px-6 lg:px-8 pb-24">
        <div className="mb-8">
          <span className="section-eyebrow">Trip memories</span>
          <h1 className="text-3xl font-bold flex items-center gap-2"><HiOutlineSparkles className="text-teal-500" /> Memory Timeline</h1>
          <p className="text-midnight-900/60 dark:text-white/60 text-sm mt-1">
            A story-style recap of each trip — auto-built from your real route, spend, and journal photos.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-midnight-900/50 dark:text-white/50">Loading your trips…</p>
        ) : trips.length === 0 ? (
          <div className="card p-10 text-center text-midnight-900/50 dark:text-white/50">
            No trips yet — create one from your Dashboard, and its recap will appear here.
          </div>
        ) : !folderTrip ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => openFolder(t)}
                className="card p-5 text-left hover:ring-2 hover:ring-teal-500/40 transition-all group"
              >
                <div className="w-full h-28 rounded-xl bg-gradient-to-br from-teal-400/80 to-sunset-400/80 flex items-center justify-center mb-4">
                  <HiOutlineFolder className="text-white text-3xl group-hover:hidden" />
                  <HiOutlineFolderOpen className="text-white text-3xl hidden group-hover:block" />
                </div>
                <p className="font-semibold text-sm">{t.title}</p>
                <p className="text-xs text-midnight-900/50 dark:text-white/50 mt-1">{t.destination} · {t.status}</p>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-3">Open folder →</p>
              </button>
            ))}
          </div>
        ) : (
          <TripFolder
            trip={folderTrip}
            tab={folderTab}
            setTab={setFolderTab}
            loading={folderLoading}
            journal={folderJournal}
            expenses={folderExpenses}
            journalForm={journalForm}
            setJournalForm={setJournalForm}
            onSubmitJournal={submitJournal}
            onDeleteJournal={deleteJournalEntry}
            onClose={closeFolder}
            onOpenRecap={() => openRecap(folderTrip)}
            preparing={preparing}
          />
        )}
      </section>

      {/* Full-screen story viewer */}
      <AnimatePresence>
        {activeTripId && slides.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-midnight-950 flex items-center justify-center"
          >
            {/* Progress bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10">
              {slides.map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{
                      width: i < slideIndex ? '100%' : i === slideIndex ? '100%' : '0%',
                      transitionDuration: i === slideIndex ? `${SLIDE_MS}ms` : '0ms',
                      transitionTimingFunction: 'linear',
                    }}
                  />
                </div>
              ))}
            </div>

            <button onClick={closeRecap} className="absolute top-8 right-4 text-white/80 hover:text-white z-10">
              <HiOutlineX className="text-2xl" />
            </button>

            {/* Tap zones */}
            <button onClick={prev} className="absolute left-0 top-0 bottom-0 w-1/3 z-10 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity">
              <HiOutlineChevronLeft className="text-white text-3xl" />
            </button>
            <button onClick={next} className="absolute right-0 top-0 bottom-0 w-2/3 z-10 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity">
              <HiOutlineChevronRight className="text-white text-3xl" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden relative flex flex-col items-center justify-center text-center p-8"
                style={{ background: slideBackground(slides[slideIndex]) }}
              >
                <Slide slide={slides[slideIndex]} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

function slideBackground(slide) {
  if (slide.type === 'memory' && slide.journal.photo_url) {
    return `linear-gradient(0deg, rgba(10,14,26,0.75), rgba(10,14,26,0.25)), url(${slide.journal.photo_url}) center/cover no-repeat`;
  }
  const gradients = {
    cover: 'linear-gradient(135deg, #0f766e, #164e63)',
    stats: 'linear-gradient(135deg, #164e63, #7c2d12)',
    memory: 'linear-gradient(135deg, #134e4a, #1e293b)',
    closing: 'linear-gradient(135deg, #7c2d12, #0f766e)',
  };
  return gradients[slide.type];
}

function Slide({ slide }) {
  if (slide.type === 'cover') {
    return (
      <div className="text-white">
        <HiOutlineSparkles className="text-4xl mx-auto mb-4 text-white/80" />
        <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Your trip recap</p>
        <h2 className="text-3xl font-display font-bold mb-2">{slide.trip.title}</h2>
        <p className="text-white/70 flex items-center justify-center gap-1.5"><HiOutlineLocationMarker /> {slide.trip.destination}</p>
      </div>
    );
  }
  if (slide.type === 'stats') {
    return (
      <div className="text-white space-y-6 w-full">
        <p className="text-xs uppercase tracking-widest text-white/60">By the numbers</p>
        <div className="grid grid-cols-1 gap-4">
          <Stat icon={HiOutlineLocationMarker} value={slide.km > 0 ? `${slide.km} km` : '—'} label="Distance covered" />
          <Stat icon={HiOutlineCalendar} value={`${slide.days} day${slide.days > 1 ? 's' : ''}`} label="On the road" />
          <Stat icon={HiOutlineCurrencyRupee} value={`₹${slide.total.toLocaleString('en-IN')}`} label="Total spent" />
        </div>
      </div>
    );
  }
  if (slide.type === 'memory') {
    return (
      <div className="text-white w-full">
        <HiOutlineHeart className="text-2xl mx-auto mb-3 text-white/80" />
        <h3 className="text-xl font-display font-bold mb-2">{slide.journal.title}</h3>
        <p className="text-white/80 text-sm leading-relaxed">{slide.journal.content}</p>
        <span className="inline-block mt-4 text-xs px-3 py-1 rounded-full bg-white/15 capitalize">{slide.journal.mood}</span>
      </div>
    );
  }
  return (
    <div className="text-white">
      <HiOutlineSparkles className="text-4xl mx-auto mb-4 text-white/80" />
      <h2 className="text-2xl font-display font-bold mb-2">That's a wrap!</h2>
      <p className="text-white/70">Thanks for reliving {slide.trip.title} with TravelPilot.</p>
    </div>
  );
}

// A per-trip "folder" — everything that belongs to one trip (journal
// entries + expenses) lives here instead of being spread across the
// Tracking page and other places.
function TripFolder({
  trip, tab, setTab, loading, journal, expenses, journalForm, setJournalForm,
  onSubmitJournal, onDeleteJournal, onClose, onOpenRecap, preparing,
}) {
  const folderTabs = [
    { key: 'journal', label: 'Journal', icon: HiOutlineBookOpen },
    { key: 'expenses', label: 'Expenses', icon: HiOutlineCurrencyRupee },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm font-semibold text-midnight-900/60 dark:text-white/60 hover:text-teal-600 dark:hover:text-teal-400">
          <HiOutlineArrowLeft /> All trips
        </button>
        <button
          onClick={onOpenRecap}
          disabled={preparing}
          className="text-xs text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 disabled:opacity-60"
        >
          <HiOutlineSparkles /> {preparing ? 'Preparing recap…' : 'View story recap'}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400/80 to-sunset-400/80 flex items-center justify-center flex-shrink-0">
          <HiOutlineFolderOpen className="text-white text-xl" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg">{trip.title}</h2>
          <p className="text-xs text-midnight-900/50 dark:text-white/50">{trip.destination} · {trip.status}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {folderTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-teal-500 text-white' : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900/60 dark:text-white/60 hover:bg-teal-500/10'
            }`}
          >
            <t.icon /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-midnight-900/50 dark:text-white/50">Loading…</p>
      ) : (
        <AnimatePresence mode="wait">
          {tab === 'journal' && (
            <motion.div key="journal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl space-y-4">
              <div className="card p-5">
                <h4 className="font-semibold text-sm mb-3">Add a memory</h4>
                <form onSubmit={onSubmitJournal} className="space-y-2">
                  <input
                    placeholder="Title, e.g. Sunset at Har Ki Pauri"
                    value={journalForm.title}
                    onChange={(e) => setJournalForm({ ...journalForm, title: e.target.value })}
                    className="input-field"
                  />
                  <textarea
                    placeholder="What happened?"
                    rows={2}
                    value={journalForm.content}
                    onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })}
                    className="input-field resize-none"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <select
                      value={journalForm.mood}
                      onChange={(e) => setJournalForm({ ...journalForm, mood: e.target.value })}
                      className="input-field !w-auto"
                    >
                      {['happy', 'excited', 'relaxed', 'adventurous', 'tired', 'nostalgic'].map((m) => (
                        <option key={m} value={m} className="capitalize">{m}</option>
                      ))}
                    </select>
                    <PhotoUploader label="Add photo" onUploaded={(url) => setJournalForm((f) => ({ ...f, photoUrl: url }))} />
                  </div>
                  <button type="submit" className="btn-secondary !text-midnight-900 dark:!text-white !bg-midnight-900/5 dark:!bg-white/10 w-full text-sm">
                    Save memory
                  </button>
                </form>
              </div>

              {journal.length === 0 ? (
                <div className="card p-6 text-center text-sm text-midnight-900/50 dark:text-white/50">No journal entries for this trip yet.</div>
              ) : (
                journal.map((j) => (
                  <div key={j.id} className="card p-5">
                    {j.photo_url && <img src={j.photo_url} alt={j.title} className="w-full h-40 object-cover rounded-xl mb-3" />}
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h4 className="font-semibold text-sm">{j.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 capitalize">{j.mood}</span>
                        <button onClick={() => onDeleteJournal(j.id)} className="text-midnight-900/30 dark:text-white/30 hover:text-red-500">
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-midnight-900/70 dark:text-white/70 leading-relaxed">{j.content}</p>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {tab === 'expenses' && (
            <motion.div key="expenses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl space-y-3">
              {expenses.expenses.length === 0 ? (
                <div className="card p-6 text-center text-sm text-midnight-900/50 dark:text-white/50">
                  No expenses logged for this trip yet — add one from your Dashboard or Group Trip page.
                </div>
              ) : (
                <>
                  {expenses.expenses.map((e) => (
                    <div key={e.id} className="card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center flex-shrink-0">
                          {e.is_ocr_scanned ? <HiOutlineCamera /> : <HiOutlineCurrencyRupee />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{e.description}</p>
                          <p className="text-xs text-midnight-900/50 dark:text-white/50 capitalize">{e.category} · {e.expense_date}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">₹{Number(e.amount).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                  <div className="card p-4 flex items-center justify-between bg-teal-500/5">
                    <p className="text-sm font-semibold">Total logged so far</p>
                    <p className="font-bold text-teal-600 dark:text-teal-400">₹{Number(expenses.total).toLocaleString('en-IN')}</p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-3">
      <Icon className="text-2xl flex-shrink-0" />
      <div className="text-left">
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-white/60">{label}</p>
      </div>
    </div>
  );
}
