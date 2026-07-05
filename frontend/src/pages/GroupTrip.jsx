import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineUserGroup, HiOutlinePlus, HiOutlineCurrencyRupee, HiOutlineLocationMarker,
  HiOutlineBadgeCheck, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineClock, HiOutlineQrcode,
  HiOutlineChatAlt2,
} from 'react-icons/hi';

import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import ReceiptScanner from '../components/ReceiptScanner';
import { buildUpiLink } from '../lib/upi';

const BADGES = [
  { id: 1, title: 'First Trip', desc: 'Completed your first tracked trip', earned: true },
  { id: 2, title: 'Eco Traveller', desc: 'Averaged 70+ eco score across trips', earned: true },
  { id: 3, title: 'Group Explorer', desc: 'Completed a trip with 3+ travellers', earned: true },
  { id: 4, title: '5-Trip Streak', desc: 'Completed 5 trips', earned: false },
  { id: 5, title: 'Budget Master', desc: 'Stayed under budget on 3 trips', earned: false },
];

// Classic greedy debt-simplification: repeatedly match the biggest debtor
// with the biggest creditor until everyone is settled. Minimizes the
// number of payments needed instead of everyone paying everyone.
function simplifyDebts(balances) {
  const debtors = balances.filter((b) => b.balance < -0.5).map((b) => ({ ...b, remaining: -b.balance })).sort((a, b) => b.remaining - a.remaining);
  const creditors = balances.filter((b) => b.balance > 0.5).map((b) => ({ ...b, remaining: b.balance })).sort((a, b) => b.remaining - a.remaining);
  const settlements = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].remaining, creditors[j].remaining);
    settlements.push({ from: debtors[i], to: creditors[j], amount: Math.round(pay * 100) / 100 });
    debtors[i].remaining -= pay;
    creditors[j].remaining -= pay;
    if (debtors[i].remaining < 0.5) i++;
    if (creditors[j].remaining < 0.5) j++;
  }
  return settlements;
}

export default function GroupTrip() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isDemo = !user || user.demo;

  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({ name: '', phone: '' });
  const [inviteStatus, setInviteStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [perHead, setPerHead] = useState(0);
  const [form, setForm] = useState({ description: '', amount: '', paidByMemberId: '', category: 'other', receiptImage: null });
  const [myUpi, setMyUpi] = useState('');
  const [upiStatus, setUpiStatus] = useState('');
  const [accepting, setAccepting] = useState(false);

  const selectedTrip = trips.find((tr) => tr.id === tripId);
  const needsAccept = selectedTrip && selectedTrip.member_status !== 'joined';

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await api.get('/trips');
        setTrips(data.trips || []);
        if (data.trips?.length) setTripId(data.trips[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, [isDemo]);

  useEffect(() => {
    if (!tripId || needsAccept) { setMembers([]); setExpenses([]); setBalances([]); return; }
    loadMembers();
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, needsAccept]);

  const acceptInvite = async () => {
    setAccepting(true);
    try {
      await api.patch(`/trips/${tripId}/members/accept`);
      const { data } = await api.get('/trips');
      setTrips(data.trips || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  async function loadMembers() {
    try {
      const { data } = await api.get(`/trips/${tripId}/members`);
      setMembers(data.members || []);
      const self = data.members?.find((m) => m.isSelf);
      setMyUpi(self?.upiId || '');
      setForm((f) => ({ ...f, paidByMemberId: f.paidByMemberId || self?.id || '' }));
    } catch {
      setMembers([]);
    }
  }

  async function loadExpenses() {
    try {
      const { data } = await api.get(`/expenses/trip/${tripId}`);
      setExpenses(data.expenses || []);
      setBalances(data.balances || []);
      setPerHead(data.perHead || 0);
    } catch {
      setExpenses([]);
      setBalances([]);
    }
  }

  const inviteMember = async (e) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.phone.trim()) return;
    setBusy(true);
    setInviteStatus('');
    try {
      const { data } = await api.post(`/trips/${tripId}/members`, inviteForm);
      setInviteStatus(data.message);
      setInviteForm({ name: '', phone: '' });
      loadMembers();
    } catch (err) {
      setInviteStatus(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setBusy(false);
    }
  };

  const toggleMyShare = async (currentlyShared) => {
    try {
      await api.patch(`/trips/${tripId}/members/me/sharing`, { shared: !currentlyShared });
      loadMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update sharing');
    }
  };

  const removeMember = async (memberId) => {
    try {
      await api.delete(`/trips/${tripId}/members/${memberId}`);
      loadMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const saveMyUpi = async (e) => {
    e.preventDefault();
    setUpiStatus('');
    try {
      const { data } = await api.patch(`/trips/${tripId}/members/me/upi`, { upiId: myUpi || null });
      setUpiStatus(data.message);
      loadExpenses();
    } catch (err) {
      setUpiStatus(err.response?.data?.message || 'Failed to save UPI ID');
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.paidByMemberId) return;
    try {
      await api.post('/expenses', {
        tripId,
        description: form.description,
        amount: Number(form.amount),
        category: form.category,
        paidByMemberId: form.paidByMemberId,
        expenseDate: new Date().toISOString().slice(0, 10),
        isOcrScanned: !!form.receiptImage,
        receiptImage: form.receiptImage,
      });
      setForm((f) => ({ ...f, description: '', amount: '', category: 'other', receiptImage: null }));
      loadExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const removeExpense = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      loadExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove expense');
    }
  };

  const handleScanned = (result) => {
    setForm((f) => ({
      ...f,
      description: result.merchant || f.description,
      amount: result.amount ? String(result.amount) : f.amount,
      category: result.category || f.category,
      receiptImage: result.receiptImage || f.receiptImage,
    }));
  };

  const settlements = simplifyDebts(balances);
  const mySettlements = settlements.filter((s) => members.find((m) => m.id === s.from.memberId)?.isSelf);

  if (isDemo) {
    return (
      <PageWrapper>
        <section className="max-w-3xl mx-auto px-6 lg:px-8 pb-24 pt-10 text-center">
          <span className="section-eyebrow">{t('group.eyebrow')}</span>
          <h1 className="text-3xl font-bold mb-3">{t('group.title')}</h1>
          <p className="text-midnight-900/60 dark:text-white/60">
            {t('group.demoDesc')}
          </p>
        </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pb-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="section-eyebrow">{t('group.eyebrow')}</span>
            <h1 className="text-3xl font-bold">{t('group.title')}</h1>
            <p className="text-midnight-900/60 dark:text-white/60 text-sm mt-1">
              {t('group.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {trips.length > 0 && (
              <select value={tripId || ''} onChange={(e) => setTripId(Number(e.target.value))} className="input-field !w-auto">
                {trips.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.title}{tr.member_status !== 'joined' ? ` (${t('group.pendingInvite')})` : ''}
                  </option>
                ))}
              </select>
            )}
            <Link
              to="/group-chat"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 transition-colors flex-shrink-0"
            >
              <HiOutlineChatAlt2 /> {t('group.openChat')}
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-midnight-900/50 dark:text-white/50">{t('common.loading')}</p>
        ) : !tripId ? (
          <div className="card p-10 text-center text-midnight-900/50 dark:text-white/50">
            {t('group.createTripFirst')}
          </div>
        ) : needsAccept ? (
          <div className="card p-10 text-center max-w-lg mx-auto">
            <HiOutlineUserGroup className="text-teal-500 text-4xl mx-auto mb-4" />
            <h2 className="font-display text-lg font-bold mb-2">{t('group.inviteBannerTitle')}</h2>
            <p className="text-sm text-midnight-900/60 dark:text-white/60 mb-6">
              {t('group.inviteBannerDesc', { trip: selectedTrip?.title })}
            </p>
            <button onClick={acceptInvite} disabled={accepting} className="btn-primary disabled:opacity-60">
              {accepting ? t('common.loading') : t('group.acceptInvite')}
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Members + location sharing */}
            <div>
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <HiOutlineUserGroup className="text-teal-500" /> {t('group.members')}
              </h2>
              <div className="space-y-3 mb-4">
                {members.map((m) => (
                  <div key={m.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-sunset-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{m.name}{m.isSelf ? ' (you)' : ''}</p>
                        {m.status === 'invited' && (
                          <p className="text-xs text-sunset-600 dark:text-sunset-400 flex items-center gap-1"><HiOutlineClock /> {t('group.inviteSent')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {m.isSelf ? (
                        <button
                          onClick={() => toggleMyShare(m.locationShared)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 transition-colors ${
                            m.locationShared ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900/50 dark:text-white/50'
                          }`}
                        >
                          <HiOutlineLocationMarker /> {m.locationShared ? 'Sharing' : 'Off'}
                        </button>
                      ) : (
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
                          m.locationShared ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900/40 dark:text-white/40'
                        }`}>
                          <HiOutlineLocationMarker /> {m.locationShared ? 'Sharing' : t('group.notShared')}
                        </span>
                      )}
                      {!m.isSelf && (
                        <button onClick={() => removeMember(m.id)} className="text-midnight-900/30 dark:text-white/30 hover:text-red-500">
                          <HiOutlineTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={inviteMember} className="space-y-2">
                <input placeholder={t('group.namePlaceholder')} value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} className="input-field" />
                <div className="flex gap-2">
                  <input placeholder={t('group.phonePlaceholder')} value={inviteForm.phone} onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })} className="input-field" />
                  <button disabled={busy} type="submit" className="btn-primary !px-4 flex-shrink-0 disabled:opacity-60"><HiOutlinePlus /></button>
                </div>
              </form>
              {inviteStatus && (
                <p className="text-xs mt-2 flex items-center gap-1 text-teal-600 dark:text-teal-400">
                  <HiOutlineCheckCircle /> {inviteStatus}
                </p>
              )}
              <p className="text-xs text-midnight-900/40 dark:text-white/40 mt-3">
                Invites are sent as a real WhatsApp/SMS message. Location is only shared with the group
                when a member explicitly turns it on.
              </p>

              {/* Your UPI ID */}
              <h3 className="font-display text-sm font-bold mt-8 mb-3">Your UPI ID</h3>
              <form onSubmit={saveMyUpi} className="flex gap-2">
                <input placeholder="yourname@okhdfcbank" value={myUpi} onChange={(e) => setMyUpi(e.target.value)} className="input-field" />
                <button type="submit" className="btn-secondary !text-midnight-900 dark:!text-white !bg-midnight-900/5 dark:!bg-white/10 flex-shrink-0 text-sm">Save</button>
              </form>
              {upiStatus && <p className="text-xs mt-1.5 text-teal-600 dark:text-teal-400">{upiStatus}</p>}
              <p className="text-xs text-midnight-900/40 dark:text-white/40 mt-2">
                Add this so trip-mates who owe you money can pay you instantly via a real UPI request link.
              </p>
            </div>

            {/* Split expenses */}
            <div>
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <HiOutlineCurrencyRupee className="text-teal-500" /> {t('group.splitExpenses')}
              </h2>
              <div className="space-y-3 mb-4">
                {expenses.length === 0 && (
                  <p className="text-xs text-midnight-900/40 dark:text-white/40">{t('group.noExpenses')}</p>
                )}
                {expenses.map((e) => (
                  <div key={e.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{e.description || e.category}</p>
                      <p className="text-xs text-midnight-900/50 dark:text-white/50">Paid by {e.paid_by_name || 'someone'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-sm">₹{Number(e.amount).toLocaleString('en-IN')}</p>
                      <button onClick={() => removeExpense(e.id)} className="text-midnight-900/30 dark:text-white/30 hover:text-red-500">
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={addExpense} className="space-y-2 mb-2">
                <input placeholder={t('group.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
                <div className="flex gap-2">
                  <input type="number" placeholder={`${t('group.amount')} ₹`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" />
                  <select value={form.paidByMemberId} onChange={(e) => setForm({ ...form, paidByMemberId: e.target.value })} className="input-field">
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}{m.isSelf ? ' (you)' : ''}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-secondary !text-midnight-900 dark:!text-white !bg-midnight-900/5 dark:!bg-white/10 w-full text-sm">{t('group.addExpense')}</button>
              </form>
              <ReceiptScanner onScanned={handleScanned} className="mb-6" />

              {balances.length > 0 && (
                <div className="card p-5 bg-teal-500/5 mb-4">
                  <p className="text-sm font-semibold mb-3">Balances (₹{perHead.toFixed(0)} / person)</p>
                  <div className="space-y-2">
                    {balances.map((b) => (
                      <div key={b.memberId} className="flex items-center justify-between text-sm">
                        <span>{b.name}</span>
                        <span className={b.balance >= 0 ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-sunset-600 dark:text-sunset-400 font-semibold'}>
                          {b.balance >= 0 ? `Gets back ₹${b.balance.toFixed(0)}` : `Owes ₹${Math.abs(b.balance).toFixed(0)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mySettlements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-1.5"><HiOutlineQrcode className="text-teal-500" /> Settle up</p>
                  {mySettlements.map((s, i) => {
                    const link = s.to.upiId ? buildUpiLink({ payeeVpa: s.to.upiId, payeeName: s.to.name, amount: s.amount, note: 'TravelPilot trip settlement' }) : null;
                    return (
                      <div key={i} className="card p-4 flex items-center justify-between">
                        <p className="text-sm">Pay <strong>{s.to.name}</strong> ₹{s.amount.toFixed(0)}</p>
                        {link ? (
                          <a href={link} className="btn-primary !py-2 !px-4 text-sm">Pay via UPI</a>
                        ) : (
                          <span className="text-xs text-midnight-900/40 dark:text-white/40">{s.to.name} hasn't added a UPI ID yet</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gamification badges */}
            <div>
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <HiOutlineBadgeCheck className="text-teal-500" /> {t('group.badges')}
              </h2>
              <div className="space-y-3">
                {BADGES.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`card p-4 flex items-center gap-3 ${b.earned ? '' : 'opacity-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${b.earned ? 'bg-gradient-to-br from-teal-400 to-sunset-400 text-white' : 'bg-midnight-900/10 dark:bg-white/10 text-midnight-900/40 dark:text-white/40'}`}>
                      <HiOutlineBadgeCheck />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{b.title}</p>
                      <p className="text-xs text-midnight-900/50 dark:text-white/50">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </PageWrapper>
  );
}
