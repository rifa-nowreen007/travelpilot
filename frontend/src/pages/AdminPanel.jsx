import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUsers, HiOutlineLocationMarker, HiOutlineCurrencyRupee,
  HiOutlineShieldExclamation, HiOutlineMailOpen, HiOutlineTrash, HiOutlineBan, HiOutlineCheckCircle,
  HiOutlineCog,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';

const MOCK_STATS = { totalUsers: 4, totalTrips: 4, totalExpenses: 33500, activeSos: 0, newFeedback: 1 };

const MOCK_REPORTS = {
  expenseByCategory: [
    { category: 'stay', total: 24000 }, { category: 'transport', total: 5300 },
    { category: 'food', total: 3000 }, { category: 'activities', total: 2500 },
  ],
  tripsByStatus: [
    { status: 'planned', total: 2 }, { status: 'ongoing', total: 1 }, { status: 'completed', total: 2 },
  ],
  avgEcoScore: 72.6,
  topDestinations: [
    { destination: 'Manali, Himachal Pradesh', total: 1 }, { destination: 'Goa', total: 1 },
    { destination: 'Rishikesh, Uttarakhand', total: 1 }, { destination: 'Alleppey, Kerala', total: 1 },
  ],
};

const MOCK_SETTINGS = [
  { setting_key: 'maintenance_mode', setting_value: 'off' },
  { setting_key: 'allow_registrations', setting_value: 'on' },
  { setting_key: 'sos_auto_escalate_minutes', setting_value: '15' },
  { setting_key: 'ai_assistant_enabled', setting_value: 'on' },
  { setting_key: 'app_version', setting_value: '2.1.0' },
];

const settingLabels = {
  maintenance_mode: 'Maintenance Mode',
  allow_registrations: 'Allow New Registrations',
  sos_auto_escalate_minutes: 'SOS Auto-Escalate (minutes)',
  ai_assistant_enabled: 'AI Assistant Enabled',
  app_version: 'App Version',
};

const catColor = { stay: 'bg-teal-500', transport: 'bg-sunset-500', food: 'bg-teal-300', activities: 'bg-sunset-300', shopping: 'bg-midnight-700', other: 'bg-midnight-900/40' };
const MOCK_USERS = [
  { id: 2, name: 'Rahul Sharma', email: 'rahul@travelpilot.com', role: 'tourist', is_active: 1 },
  { id: 3, name: 'Ananya Iyer', email: 'ananya@travelpilot.com', role: 'tourist', is_active: 1 },
  { id: 4, name: 'Vikram Singh', email: 'vikram@travelpilot.com', role: 'tourist', is_active: 1 },
];
const MOCK_TRIPS = [
  { id: 1, title: 'Himalayan Backpacking', destination: 'Manali', user_name: 'Rahul Sharma', status: 'planned', budget: 25000 },
  { id: 2, title: 'Goa Beach Getaway', destination: 'Goa', user_name: 'Rahul Sharma', status: 'completed', budget: 18000 },
];

const TABS = ['Overview', 'Users', 'Trips', 'Reports', 'Settings', 'Feedback'];

export default function AdminPanel() {
  const { user } = useAuth();
  const isDemo = user?.demo;
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(MOCK_STATS);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [settings, setSettings] = useState(MOCK_SETTINGS);

  useEffect(() => {
    async function load() {
      if (isDemo) {
        setStats(MOCK_STATS);
        setUsers(MOCK_USERS);
        setTrips(MOCK_TRIPS);
        setFeedback([{ id: 1, name: 'Priya Nair', email: 'priya@example.com', message: 'Loved the SOS and OCR features!', status: 'reviewed' }]);
        setReports(MOCK_REPORTS);
        setSettings(MOCK_SETTINGS);
        return;
      }
      try {
        const [s, u, t, f, r, st] = await Promise.all([
          api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/trips'), api.get('/admin/feedback'),
          api.get('/admin/reports'), api.get('/admin/settings'),
        ]);
        setStats(s.data.stats);
        setUsers(u.data.users);
        setTrips(t.data.trips);
        setFeedback(f.data.feedback);
        setReports(r.data.reports);
        setSettings(st.data.settings);
      } catch {
        setStats(MOCK_STATS); setUsers(MOCK_USERS); setTrips(MOCK_TRIPS);
        setReports(MOCK_REPORTS); setSettings(MOCK_SETTINGS);
      }
    }
    load();
  }, [isDemo]);

  const toggleSetting = async (key, current) => {
    const next = current === 'on' ? 'off' : 'on';
    setSettings(settings.map((s) => (s.setting_key === key ? { ...s, setting_value: next } : s)));
    if (isDemo) return;
    try {
      await api.put(`/admin/settings/${key}`, { value: next });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update setting');
    }
  };

  const toggleUser = async (u) => {
    if (isDemo) {
      setUsers(users.map((x) => (x.id === u.id ? { ...x, is_active: x.is_active ? 0 : 1 } : x)));
      return;
    }
    try {
      await api.patch(`/admin/users/${u.id}/status`, { isActive: !u.is_active });
      setUsers(users.map((x) => (x.id === u.id ? { ...x, is_active: x.is_active ? 0 : 1 } : x)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const removeUser = async (u) => {
    if (!confirm(`Remove ${u.name}?`)) return;
    if (isDemo) {
      setUsers(users.filter((x) => x.id !== u.id));
      return;
    }
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers(users.filter((x) => x.id !== u.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: HiOutlineUsers, color: 'teal' },
    { label: 'Total Trips', value: stats.totalTrips, icon: HiOutlineLocationMarker, color: 'sunset' },
    { label: 'Expenses Tracked', value: `₹${Number(stats.totalExpenses).toLocaleString('en-IN')}`, icon: HiOutlineCurrencyRupee, color: 'teal' },
    { label: 'Active SOS Alerts', value: stats.activeSos, icon: HiOutlineShieldExclamation, color: 'sunset' },
    { label: 'New Feedback', value: stats.newFeedback, icon: HiOutlineMailOpen, color: 'teal' },
  ];

  return (
    <PageWrapper>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="mb-8">
          <span className="section-eyebrow">Admin Panel</span>
          <h1 className="text-3xl font-bold">Operations Dashboard</h1>
          {isDemo && (
            <p className="text-sm mt-3 px-4 py-3 rounded-xl bg-sunset-500/10 text-sunset-700 dark:text-sunset-300 inline-block">
              Demo mode — showing sample platform data.
            </p>
          )}
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t ? 'bg-teal-500 text-white' : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900/60 dark:text-white/60 hover:bg-teal-500/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card p-6"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${s.color === 'teal' ? 'bg-teal-500/10 text-teal-500' : 'bg-sunset-500/10 text-sunset-500'}`}>
                  <s.icon className="text-xl" />
                </div>
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-xs text-midnight-900/50 dark:text-white/50 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'Users' && (
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-midnight-900/5 dark:bg-white/5 text-left">
                <tr>
                  <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Name</th>
                  <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Email</th>
                  <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Role</th>
                  <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Status</th>
                  <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-midnight-900/5 dark:border-white/5">
                    <td className="px-5 py-3 font-medium">{u.name}</td>
                    <td className="px-5 py-3 text-midnight-900/60 dark:text-white/60">{u.email}</td>
                    <td className="px-5 py-3 capitalize">{u.role}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.is_active ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-red-500/10 text-red-500'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggleUser(u)} className="p-2 rounded-lg hover:bg-teal-500/10 text-teal-500" title="Toggle status">
                          {u.is_active ? <HiOutlineBan /> : <HiOutlineCheckCircle />}
                        </button>
                        <button onClick={() => removeUser(u)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500" title="Delete user">
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'Trips' && (
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-midnight-900/5 dark:bg-white/5 text-left">
                <tr>
                  <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Trip</th>
                  <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Traveller</th>
                  <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Destination</th>
                  <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60">Status</th>
                  <th className="px-5 py-3 font-medium text-midnight-900/60 dark:text-white/60 text-right">Budget</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id} className="border-t border-midnight-900/5 dark:border-white/5">
                    <td className="px-5 py-3 font-medium">{t.title}</td>
                    <td className="px-5 py-3 text-midnight-900/60 dark:text-white/60">{t.user_name}</td>
                    <td className="px-5 py-3">{t.destination}</td>
                    <td className="px-5 py-3 capitalize">{t.status}</td>
                    <td className="px-5 py-3 text-right font-semibold">₹{Number(t.budget).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'Reports' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-display font-semibold mb-5">Expenses by Category</h3>
              <div className="space-y-4">
                {reports.expenseByCategory.map((c) => {
                  const max = Math.max(...reports.expenseByCategory.map((x) => Number(x.total)));
                  return (
                    <div key={c.category}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="capitalize font-medium">{c.category}</span>
                        <span className="text-midnight-900/50 dark:text-white/50">₹{Number(c.total).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-midnight-900/5 dark:bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${(Number(c.total) / max) * 100}%` }} transition={{ duration: 0.6 }}
                          className={`h-full rounded-full ${catColor[c.category] || 'bg-teal-500'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display font-semibold mb-5">Trips by Status</h3>
              <div className="flex items-end gap-4 h-40">
                {reports.tripsByStatus.map((s) => {
                  const max = Math.max(...reports.tripsByStatus.map((x) => Number(x.total)), 1);
                  return (
                    <div key={s.status} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: `${(Number(s.total) / max) * 100}%` }} transition={{ duration: 0.6 }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-teal-500 to-teal-400 min-h-[6px]"
                      />
                      <p className="text-xs font-medium capitalize">{s.status}</p>
                      <p className="text-xs text-midnight-900/40 dark:text-white/40">{s.total}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display font-semibold mb-4">Average Eco Score</h3>
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                    <path d="M18 2 a16 16 0 1 1 0 32 a16 16 0 1 1 0 -32" fill="none" stroke="currentColor" strokeWidth="3" className="text-midnight-900/5 dark:text-white/10" />
                    <path d="M18 2 a16 16 0 1 1 0 32 a16 16 0 1 1 0 -32" fill="none" stroke="#0FBFA6" strokeWidth="3" strokeDasharray={`${reports.avgEcoScore}, 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-lg">{reports.avgEcoScore}</span>
                </div>
                <p className="text-sm text-midnight-900/60 dark:text-white/60">Platform-wide average, blending transport mode, distance and duration across every logged trip.</p>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display font-semibold mb-4">Top Destinations</h3>
              <ul className="space-y-3">
                {reports.topDestinations.map((d, i) => (
                  <li key={d.destination} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-500 text-xs flex items-center justify-center font-semibold">{i + 1}</span>{d.destination}</span>
                    <span className="text-midnight-900/50 dark:text-white/50">{d.total} trip{d.total > 1 ? 's' : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === 'Settings' && (
          <div className="card divide-y divide-midnight-900/5 dark:divide-white/5">
            {settings.map((s) => (
              <div key={s.setting_key} className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
                    <HiOutlineCog />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{settingLabels[s.setting_key] || s.setting_key}</p>
                    <p className="text-xs text-midnight-900/40 dark:text-white/40">{s.setting_key}</p>
                  </div>
                </div>
                {s.setting_value === 'on' || s.setting_value === 'off' ? (
                  <button
                    onClick={() => toggleSetting(s.setting_key, s.setting_value)}
                    className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${s.setting_value === 'on' ? 'bg-teal-500 justify-end' : 'bg-midnight-900/15 dark:bg-white/15 justify-start'}`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white block" />
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-midnight-900/70 dark:text-white/70">{s.setting_value}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'Feedback' && (
          <div className="space-y-4">
            {feedback.map((f) => (
              <div key={f.id} className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{f.name}</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 capitalize">{f.status}</span>
                </div>
                <p className="text-xs text-midnight-900/50 dark:text-white/50 mb-3">{f.email}</p>
                <p className="text-sm text-midnight-900/75 dark:text-white/75">{f.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}
