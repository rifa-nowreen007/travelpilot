import { motion } from 'framer-motion';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { PiCompassRoseDuotone } from 'react-icons/pi';

// Deterministic pseudo-QR pattern (visual only, mock — not a scannable code)
function MockQr() {
  const size = 11;
  const cells = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isFinder = (x < 3 && y < 3) || (x > size - 4 && y < 3) || (x < 3 && y > size - 4);
      cells.push({ x, y, on: isFinder ? true : rand() > 0.55 });
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-32 h-32 sm:w-36 sm:h-36">
      <rect width={size} height={size} fill="white" rx="1" />
      {cells.map((c, i) => (
        c.on && <rect key={i} x={c.x} y={c.y} width="1" height="1" fill="#0A1F3D" />
      ))}
    </svg>
  );
}

export default function DownloadApp() {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl bg-gradient-to-br from-midnight-900 via-midnight-900 to-midnight-700 overflow-hidden px-8 sm:px-14 py-14 flex flex-col lg:flex-row items-center gap-12"
      >
        <div className="absolute inset-0 bg-compass-grid [background-size:22px_22px] opacity-20" />
        <PiCompassRoseDuotone className="absolute -right-10 -bottom-10 text-[16rem] text-teal-500/10 rotate-12 pointer-events-none" />

        <div className="relative flex-1 text-center lg:text-left">
          <span className="section-eyebrow">Take it on the road</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Get the TravelPilot mobile app</h2>
          <p className="text-white/60 max-w-lg mx-auto lg:mx-0 mb-7 leading-relaxed">
            Automatic trip tracking, offline SOS via SMS fallback, and receipt scanning work best
            in your pocket. Scan the code or grab it from your app store.
          </p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-3">
            <a href="#" className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-colors text-white">
              <FaApple className="text-2xl" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] text-white/50">Download on the</span>
                <span className="block text-sm font-semibold">App Store</span>
              </span>
            </a>
            <a href="#" className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-colors text-white">
              <FaGooglePlay className="text-xl" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] text-white/50">Get it on</span>
                <span className="block text-sm font-semibold">Google Play</span>
              </span>
            </a>
          </div>
        </div>

        <div className="relative flex-shrink-0 bg-white p-4 rounded-2xl shadow-xl">
          <MockQr />
          <p className="text-center text-[10px] text-midnight-900/50 mt-2 font-medium">Scan to preview (mock)</p>
        </div>
      </motion.div>
    </section>
  );
}
