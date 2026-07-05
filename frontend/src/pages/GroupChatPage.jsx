import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowLeft, HiOutlineChatAlt2 } from 'react-icons/hi';

import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import GroupChat from '../components/GroupChat';

// Group chat now lives on its own page instead of being squeezed into a
// column on the Group Trip page — same trips, just a clearer, less
// cramped place to actually talk to your travel group.
export default function GroupChatPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isDemo = !user || user.demo;

  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    api.get('/trips')
      .then(({ data }) => {
        setTrips(data.trips || []);
        if (data.trips?.length) setTripId(data.trips[0].id);
      })
      .finally(() => setLoading(false));
  }, [isDemo]);

  if (isDemo) {
    return (
      <PageWrapper>
        <section className="max-w-3xl mx-auto px-6 lg:px-8 pb-24 pt-10 text-center">
          <span className="section-eyebrow">{t('group.eyebrow')}</span>
          <h1 className="text-3xl font-bold mb-3">{t('group.chatTitle')}</h1>
          <p className="text-midnight-900/60 dark:text-white/60">{t('common.signInPrompt')}</p>
        </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <section className="max-w-3xl mx-auto px-6 lg:px-8 pb-24">
        <Link to="/group" className="inline-flex items-center gap-1.5 text-sm font-semibold text-midnight-900/60 dark:text-white/60 hover:text-teal-600 dark:hover:text-teal-400 mb-6">
          <HiOutlineArrowLeft /> {t('group.backToGroup')}
        </Link>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="section-eyebrow">{t('group.eyebrow')}</span>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <HiOutlineChatAlt2 className="text-teal-500" /> {t('group.chatTitle')}
            </h1>
          </div>
          {trips.length > 0 && (
            <select
              value={tripId || ''}
              onChange={(e) => setTripId(Number(e.target.value))}
              className="input-field !w-auto"
            >
              {trips.map((tr) => <option key={tr.id} value={tr.id}>{tr.title}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-midnight-900/50 dark:text-white/50">{t('common.loading')}</p>
        ) : trips.length === 0 ? (
          <div className="card p-10 text-center text-midnight-900/50 dark:text-white/50">{t('common.noTripsYet')}</div>
        ) : (
          <div className="card p-6">
            <GroupChat tripId={tripId} />
          </div>
        )}
      </section>
    </PageWrapper>
  );
}
