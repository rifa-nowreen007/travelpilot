import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineChatAlt2, HiOutlinePaperAirplane, HiOutlineWifi } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getSocket } from '../lib/socket';
import PhotoUploader from './PhotoUploader';

// Real-time chat for one trip's group. Loads existing history over REST,
// then joins a Socket.io room for that trip so new messages from anyone
// else in the group show up instantly without a page refresh.
export default function GroupChat({ tripId, showHeading = true }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploaderKey, setUploaderKey] = useState(0);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;

    setLoading(true);
    api.get(`/group-chat/${tripId}`)
      .then(({ data }) => { if (!cancelled) setMessages(data.messages || []); })
      .catch(() => { if (!cancelled) setMessages([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => { setConnected(true); socket.emit('join_trip', tripId); };
    const onDisconnect = () => setConnected(false);
    const onNewMessage = (msg) => {
      if (Number(msg.trip_id) !== Number(tripId)) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_message', onNewMessage);

    if (socket.connected) onConnect();
    else socket.connect();

    return () => {
      cancelled = true;
      socket.emit('leave_trip', tripId);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_message', onNewMessage);
    };
  }, [tripId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !socketRef.current) return;
    socketRef.current.emit('send_message', { tripId, message: trimmed });
    setText('');
  };

  // Photos send immediately on upload, like a normal chat app, instead of
  // needing a separate "send" click. Remounting PhotoUploader (via the key
  // bump) clears its internal "photo added" preview for the next one.
  const sendPhoto = (url) => {
    if (!socketRef.current || !url) return;
    socketRef.current.emit('send_message', { tripId, photoUrl: url });
    setUploaderKey((k) => k + 1);
  };

  const { t } = useTranslation();

  return (
    <div>
      {showHeading && (
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <HiOutlineChatAlt2 className="text-teal-500" /> {t('group.chatTitle')}
          <span className={`ml-auto text-xs font-medium flex items-center gap-1 ${connected ? 'text-teal-600 dark:text-teal-400' : 'text-midnight-900/30 dark:text-white/30'}`}>
            <HiOutlineWifi /> {connected ? t('group.live') : t('group.connecting')}
          </span>
        </h2>
      )}
      {!showHeading && (
        <div className={`text-xs font-medium flex items-center gap-1 justify-end mb-2 ${connected ? 'text-teal-600 dark:text-teal-400' : 'text-midnight-900/30 dark:text-white/30'}`}>
          <HiOutlineWifi /> {connected ? t('group.live') : t('group.connecting')}
        </div>
      )}

      <div className="card p-4 h-80 overflow-y-auto flex flex-col gap-3 mb-3">
        {loading ? (
          <p className="text-xs text-midnight-900/40 dark:text-white/40 m-auto">{t('common.loading')}</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-midnight-900/40 dark:text-white/40 m-auto">{t('group.noMessages')}</p>
        ) : (
          messages.map((m) => {
            const mine = Number(m.user_id) === Number(user?.id);
            return (
              <div key={m.id} className={`max-w-[80%] ${mine ? 'self-end text-right' : 'self-start'}`}>
                {!mine && <p className="text-[10px] text-midnight-900/40 dark:text-white/40 mb-0.5">{m.sender_name}</p>}
                <div className={`px-3 py-2 rounded-2xl text-sm inline-block ${
                  mine ? 'bg-teal-500 text-white rounded-br-sm' : 'bg-midnight-900/5 dark:bg-white/10 rounded-bl-sm'
                }`}>
                  {m.photo_url && (
                    <img src={m.photo_url} alt="Shared" className="rounded-xl max-w-[200px] max-h-[200px] object-cover mb-1" />
                  )}
                  {m.message && <span>{m.message}</span>}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mb-2">
        <PhotoUploader key={uploaderKey} label={t('group.sendPhoto')} onUploaded={sendPhoto} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('group.messagePlaceholder')}
          className="input-field"
        />
        <button type="submit" disabled={!connected || !text.trim()} className="btn-primary !px-4 flex-shrink-0 disabled:opacity-60">
          <HiOutlinePaperAirplane className="rotate-90" />
        </button>
      </form>
    </div>
  );
}
