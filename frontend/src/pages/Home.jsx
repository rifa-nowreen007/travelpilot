import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiOutlineLocationMarker, HiOutlineChatAlt2, HiOutlineCamera,
  HiOutlineUserGroup, HiOutlineShieldExclamation, HiOutlineChartBar,
  HiOutlineArrowRight, HiOutlineDeviceMobile, HiOutlinePlay,
} from 'react-icons/hi';
import { PiCompassRoseDuotone } from 'react-icons/pi';
import PageWrapper from '../components/PageWrapper';
import DownloadApp from '../components/DownloadApp';

const features = [
  { icon: HiOutlineLocationMarker, title: 'Auto Trip Tracking', desc: 'Detects when you start moving and logs your route, stops and distance — zero manual input.' },
  { icon: HiOutlineChatAlt2, title: 'AI Travel Assistant', desc: 'Ask for itineraries, local tips or safety advice in plain language, any time of day.' },
  { icon: HiOutlineCamera, title: 'Expense OCR', desc: 'Snap a receipt and it is categorised and added to your trip budget automatically.' },
  { icon: HiOutlineUserGroup, title: 'Group Travel', desc: 'Share live itineraries and split costs with everyone on the trip in real time.' },
  { icon: HiOutlineShieldExclamation, title: 'One-Tap SOS', desc: 'Sends your live location to emergency contacts and local authorities instantly.' },
  { icon: HiOutlineChartBar, title: 'Smart Insights', desc: 'See spend patterns, trip stats and suggestions to travel smarter next time.' },
];

const testimonials = [
  { name: 'Ishita Verma', role: 'Solo Backpacker', quote: 'The SOS feature genuinely made my parents comfortable letting me trek alone in Spiti.', avatar: 'IV' },
  { name: 'Karan Patel', role: 'Group Trip Organiser', quote: 'Splitting expenses across six friends used to be a spreadsheet nightmare. Not anymore.', avatar: 'KP' },
  { name: 'Meera Nair', role: 'Frequent Business Traveller', quote: 'Auto tracking plus OCR receipts means my expense reports write themselves now.', avatar: 'MN' },
];

const stats = [
  { value: '6', label: 'Core Modules' },
  { value: '100%', label: 'Auto-tracked Trips' },
  { value: '<1s', label: 'SOS Alert Dispatch' },
  { value: '24/7', label: 'AI Assistant Uptime' },
];

export default function Home() {
  return (
    <PageWrapper>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-800 -z-20" />
        <div className="absolute inset-0 bg-compass-grid [background-size:22px_22px] opacity-40 -z-10" />
        <div className="absolute -top-32 -right-20 w-[32rem] h-[32rem] bg-teal-500/20 rounded-full blur-3xl animate-float-slow -z-10" />
        <div className="absolute top-40 -left-32 w-96 h-96 bg-sunset-500/20 rounded-full blur-3xl animate-float -z-10" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-36 lg:pt-24 lg:pb-48 text-white">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold tracking-wide uppercase text-teal-300 mb-6">
                <PiCompassRoseDuotone className="text-base" /> Smart Travel Companion
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] mb-6">
                Your Intelligent<br />
                <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-sunset-400 bg-clip-text text-transparent">
                  Travel Companion
                </span>
              </h1>
              <p className="text-lg font-medium text-white/80 max-w-lg mb-9 leading-relaxed">
                TravelPilot tracks your trips automatically, plans itineraries with AI,
                scans your receipts, and keeps you safe with one-tap SOS — so you can
                focus on the journey, not the logistics.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/dashboard" className="btn-primary">
                  <HiOutlineDeviceMobile /> Open Dashboard
                </Link>
                <Link to="/itinerary" className="btn-secondary">
                  <HiOutlinePlay /> Plan a Trip
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-14 max-w-lg">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-2xl font-bold text-teal-300">{s.value}</div>
                    <div className="text-xs text-white/50 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative hidden lg:block"
            >
              <div className="relative mx-auto w-80 rounded-[2.5rem] glass p-3 shadow-2xl">
                <div className="rounded-[2rem] overflow-hidden bg-midnight-900">
                  <div className="p-6 pb-10">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-xs text-white/50">Current Trip</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300">Live</span>
                    </div>
                    <h3 className="font-display font-semibold text-white mb-1">Manali, Himachal Pradesh</h3>
                    <p className="text-xs text-white/40 mb-8">Auto-tracked · 3 days in</p>

                    <div className="space-y-3">
                      {[
                        { label: 'Distance covered', value: '142 km' },
                        { label: 'Expenses logged', value: '₹8,700' },
                        { label: 'Group members', value: '3 travellers' },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between glass rounded-xl px-4 py-3">
                          <span className="text-xs text-white/60">{row.label}</span>
                          <span className="text-sm font-semibold text-white">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    <button className="w-full mt-8 py-3 rounded-xl bg-sunset-500 text-white text-sm font-semibold flex items-center justify-center gap-2 animate-pulse">
                      <HiOutlineShieldExclamation /> SOS
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-8 glass rounded-2xl px-4 py-3 shadow-xl max-w-[15rem]">
                <p className="text-xs text-white/50">AI Assistant</p>
                <p className="text-sm text-white font-medium">"Rain expected tomorrow — pack a jacket ☔"</p>
              </div>
            </motion.div>
          </div>
        </div>

        <svg className="absolute bottom-0 left-0 right-0 text-sand-50 dark:text-midnight-950" viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40L60 35C120 30 240 20 360 22C480 24 600 38 720 44C840 50 960 48 1080 40C1200 32 1320 18 1380 11L1440 4V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V40Z" fill="currentColor" />
        </svg>
      </section>

      {/* ---------------- FEATURES OVERVIEW ---------------- */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-eyebrow">What TravelPilot does</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything a modern traveller needs, in one app</h2>
          <p className="text-midnight-900/60 dark:text-white/60">
            Six focused modules that work together — designed to remove the busywork
            from travel planning, spending and safety.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="card p-7"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 text-2xl mb-5">
                <f.icon />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-midnight-900/60 dark:text-white/60 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold hover:gap-3 transition-all">
            Open your dashboard <HiOutlineArrowRight />
          </Link>
        </div>
      </section>

      {/* ---------------- APP DOWNLOAD / DEMO CTA ---------------- */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-midnight-900 to-midnight-700 px-8 py-16 sm:px-16 text-center text-white">
          <div className="absolute inset-0 bg-compass-grid [background-size:20px_20px] opacity-30" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Take TravelPilot with you</h2>
            <p className="text-white/70 max-w-xl mx-auto mb-8">
              The web experience mirrors how the mobile app manages trips, expenses and safety —
              plan, track and travel from any device.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/dashboard" className="btn-primary">Open Dashboard</Link>
              <Link to="/register" className="btn-secondary">Create Free Account</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-eyebrow">Traveller feedback</span>
          <h2 className="text-3xl sm:text-4xl font-bold">What early testers are saying</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="card p-7"
            >
              <p className="text-midnight-900/80 dark:text-white/80 leading-relaxed mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-sunset-400 flex items-center justify-center text-white text-sm font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-midnight-900/50 dark:text-white/50">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <DownloadApp />
    </PageWrapper>
  );
}
