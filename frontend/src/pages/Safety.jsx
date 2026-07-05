import { useEffect, useState } from 'react';
import {
  HiOutlineShieldExclamation, HiOutlinePhone, HiOutlinePlus, HiOutlineTrash,
  HiOutlineOfficeBuilding, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineLocationMarker,
} from 'react-icons/hi';
import { FaHospital, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import LeafletMap from '../components/LeafletMap';

export default function Safety() {
  const { user } = useAuth();
  const isDemo = !user || user.demo;

  const [sosState, setSosState] = useState('idle'); // idle | sending | sent | error
  const [sosResult, setSosResult] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [shareLocation, setShareLocation] = useState(true);

  const [nearby, setNearby] = useState({ hospitals: [], police: [] });
  const [nearbySource, setNearbySource] = useState(''); // trip destination name, or "your location"
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyError, setNearbyError] = useState('');

  useEffect(() => {
    if (isDemo) { setNearbyLoading(false); return; }
    api.get('/emergency-contacts').then(({ data }) => setContacts(data.contacts || [])).catch(() => {});
    loadNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  // Prefer the destination of the trip currently relevant to the user
  // (so safety info is ready before they even arrive); fall back to their
  // live GPS position if there's no trip with real coordinates yet.
  async function loadNearby() {
    setNearbyLoading(true);
    setNearbyError('');
    try {
      const { data } = await api.get('/trips/active');
      if (data.trip?.dest_lat && data.trip?.dest_lng) {
        await fetchNearby(data.trip.dest_lat, data.trip.dest_lng, data.trip.destination);
        return;
      }
    } catch {
      /* fall through to GPS */
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude, 'your location'),
        () => { setNearbyLoading(false); setNearbyError('Enable location, or create a trip, to see nearby help.'); },
        { timeout: 6000 }
      );
    } else {
      setNearbyLoading(false);
    }
  }

  async function fetchNearby(lat, lng, source) {
    try {
      const { data } = await api.get('/safety/nearby', { params: { lat, lng } });
      setNearby({ hospitals: data.hospitals || [], police: data.police || [] });
      setNearbySource(source);
    } catch {
      setNearbyError("Couldn't load nearby hospitals/police right now.");
    } finally {
      setNearbyLoading(false);
    }
  }

  const handleSos = () => {
    if (isDemo) return;
    setSosState('sending');
    setSosResult(null);

    const trigger = (coords) => {
      api
        .post('/safety/sos', {
          lat: coords?.latitude ?? null,
          lng: coords?.longitude ?? null,
          message: 'Emergency SOS triggered from Safety Hub',
        })
        .then(({ data }) => {
          setSosResult(data);
          setSosState('sent');
          setTimeout(() => setSosState('idle'), 6000);
        })
        .catch((err) => {
          setSosResult({ message: err.response?.data?.message || 'Failed to trigger SOS' });
          setSosState('error');
          setTimeout(() => setSosState('idle'), 5000);
        });
    };

    if (shareLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => trigger(pos.coords),
        () => trigger(null), // still send the alert even if location permission is denied
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      trigger(null);
    }
  };

  const addContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    try {
      const { data } = await api.post('/emergency-contacts', newContact);
      setContacts([...contacts, data.contact]);
      setNewContact({ name: '', phone: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add contact');
    }
  };

  const removeContact = async (id) => {
    try {
      await api.delete(`/emergency-contacts/${id}`);
      setContacts(contacts.filter((c) => c.id !== id));
    } catch {
      /* no-op */
    }
  };

  const combinedNearby = [...nearby.hospitals, ...nearby.police].sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <PageWrapper>
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pb-24">
        <div className="mb-8">
          <span className="section-eyebrow">Stay protected</span>
          <h1 className="text-3xl font-bold">Safety Hub</h1>
          <p className="text-midnight-900/60 dark:text-white/60 text-sm mt-1">
            Emergency SOS and real nearby hospitals & police — all in one place.
          </p>
        </div>

        {/* SOS panel */}
        <div className="card p-8 mb-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-l-4 border-l-sunset-500">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-1">
              <HiOutlineShieldExclamation className="text-sunset-500" /> Emergency SOS
            </h2>
            <p className="text-sm text-midnight-900/60 dark:text-white/60">
              One tap sends your live location and a real SMS/WhatsApp alert to every contact below.
            </p>
            <label className="flex items-center gap-2 mt-3 text-xs text-midnight-900/50 dark:text-white/50">
              <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} />
              Share live location during SOS (with consent)
            </label>
            {isDemo && (
              <p className="text-xs text-sunset-600 dark:text-sunset-400 mt-2">Sign in to trigger a real alert — demo mode won't send anything.</p>
            )}
            {sosResult && (
              <div className="mt-3 text-xs space-y-1">
                <p className={sosState === 'error' ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'}>{sosResult.message}</p>
                {sosResult.notified?.map((n, i) => (
                  <p key={i} className="flex items-center gap-1.5 text-midnight-900/60 dark:text-white/60">
                    {n.ok ? <HiOutlineCheckCircle className="text-teal-500" /> : <HiOutlineXCircle className="text-red-500" />}
                    {n.name} — {n.ok ? `notified via ${n.channel}` : 'not delivered'}
                  </p>
                ))}
                {sosResult.twilioConfigured === false && (
                  <p className="text-midnight-900/40 dark:text-white/40">Twilio isn't configured on the server yet, so this alert was logged but not actually texted — add TWILIO_* keys to backend/.env to send real messages.</p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleSos}
            disabled={isDemo || sosState === 'sending'}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-xl transition-all flex-shrink-0 disabled:opacity-60 ${
              sosState === 'sent' ? 'bg-teal-600 scale-105'
              : sosState === 'sending' ? 'bg-red-600 scale-105 animate-pulse'
              : sosState === 'error' ? 'bg-red-500'
              : 'bg-gradient-to-br from-sunset-400 to-sunset-600 hover:scale-105'
            }`}
          >
            {sosState === 'sending' && <><HiOutlineShieldExclamation className="text-2xl mb-1 animate-pulse" /><span className="text-xs">Sending…</span></>}
            {sosState === 'sent' && <><HiOutlineCheckCircle className="text-2xl mb-1" /><span className="text-xs">Alert sent</span></>}
            {sosState === 'error' && <><HiOutlineXCircle className="text-2xl mb-1" /><span className="text-xs">Try again</span></>}
            {sosState === 'idle' && <><HiOutlineShieldExclamation className="text-2xl mb-1" /><span className="text-xs">SOS</span></>}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Emergency contacts */}
          <div>
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <HiOutlinePhone className="text-teal-500" /> Emergency Contacts
            </h2>
            <div className="space-y-3 mb-4">
              {contacts.map((c) => (
                <div key={c.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-midnight-900/50 dark:text-white/50">{c.phone}</p>
                  </div>
                  <button onClick={() => removeContact(c.id)} className="text-midnight-900/30 dark:text-white/30 hover:text-red-500">
                    <HiOutlineTrash />
                  </button>
                </div>
              ))}
              {!isDemo && contacts.length === 0 && (
                <p className="text-xs text-midnight-900/40 dark:text-white/40">No emergency contacts yet — add one below so SOS has someone to actually notify.</p>
              )}
            </div>
            <form onSubmit={addContact} className="flex gap-2">
              <input placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="input-field" />
              <input placeholder="Phone, e.g. +91 98xxxxxxx" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="input-field" />
              <button type="submit" className="btn-primary !px-4 flex-shrink-0"><HiOutlinePlus /></button>
            </form>
          </div>

          {/* Nearby help — real data from OpenStreetMap, based on the
              trip destination when there is one, or the browser's live
              GPS position otherwise. */}
          <div>
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <HiOutlineOfficeBuilding className="text-teal-500" /> Nearest Hospital & Police
            </h2>
            {isDemo ? (
              <div className="card p-6 text-sm text-midnight-900/60 dark:text-white/60">
                Sign in and create a trip to see real hospitals and police stations near your destination.
              </div>
            ) : nearbyLoading ? (
              <div className="card p-6 text-sm text-midnight-900/50 dark:text-white/50">Finding nearby help…</div>
            ) : (
              <>
                {combinedNearby.length > 0 && (
                  <LeafletMap
                    points={combinedNearby.map((n) => ({ lat: n.lat, lng: n.lng, label: n.name }))}
                    height={220}
                    className="mb-4"
                    interactive
                  />
                )}
                <p className="text-xs text-midnight-900/40 dark:text-white/40 mb-3 flex items-center gap-1">
                  <HiOutlineLocationMarker /> {nearbySource ? `Near ${nearbySource}` : 'Nearby'} · live OpenStreetMap data
                </p>
                {nearbyError && <p className="text-xs text-red-500 mb-3">{nearbyError}</p>}
                <div className="space-y-3">
                  {combinedNearby.length === 0 && !nearbyError && (
                    <p className="text-xs text-midnight-900/40 dark:text-white/40">No hospitals or police stations found nearby in OpenStreetMap's data for this area.</p>
                  )}
                  {combinedNearby.map((n) => (
                    <div key={`${n.type}-${n.id}`} className="card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${n.type === 'hospital' ? 'bg-red-500/10 text-red-500' : 'bg-teal-500/10 text-teal-500'}`}>
                          {n.type === 'hospital' ? <FaHospital /> : <FaShieldAlt />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{n.name}</p>
                          <p className="text-xs text-midnight-900/50 dark:text-white/50">
                            {n.distanceKm} km away{n.phone ? ` · ${n.phone}` : ' · number not listed'}
                          </p>
                        </div>
                      </div>
                      {n.phone ? (
                        <a href={`tel:${n.phone}`} className="text-teal-600 dark:text-teal-400 text-sm font-semibold flex-shrink-0">Call</a>
                      ) : (
                        <span className="text-xs text-midnight-900/30 dark:text-white/30 flex-shrink-0">No number</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
