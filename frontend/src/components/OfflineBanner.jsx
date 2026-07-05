import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineWifi } from 'react-icons/hi';

// Visible confirmation that offline mode is doing something — without
// this, there's no way to tell from the UI whether the service worker is
// actually serving cached content or the page just hasn't needed the
// network yet.
export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[60] bg-sunset-500 text-white text-sm font-semibold text-center py-2 flex items-center justify-center gap-2"
        >
          <HiOutlineWifi className="text-base" />
          You're offline — showing saved data. Some actions won't work until you're back online.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
