import { Link } from 'react-router-dom';
import { PiCompassRoseDuotone } from 'react-icons/pi';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="relative mt-24 border-t border-midnight-900/10 dark:border-white/10 bg-sand-100/60 dark:bg-midnight-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-3">
            <PiCompassRoseDuotone className="text-2xl text-teal-500" />
            <span className="font-display font-bold text-lg">Travel<span className="text-teal-500">Pilot</span></span>
          </Link>
          <p className="text-sm text-midnight-900/60 dark:text-white/50 max-w-xs">
            Your intelligent travel companion — built for Smart India Hackathon 2025.
          </p>
        </div>

        {user ? (
          <div>
            <h4 className="font-display font-semibold mb-3 text-sm tracking-wide uppercase text-midnight-900/80 dark:text-white/80">Explore</h4>
            <ul className="space-y-2 text-sm text-midnight-900/60 dark:text-white/50">
              <li><Link to="/itinerary" className="hover:text-teal-500 transition-colors">Itinerary Planner</Link></li>
              <li><Link to="/tracking" className="hover:text-teal-500 transition-colors">Live Tracking</Link></li>
              <li><Link to="/group" className="hover:text-teal-500 transition-colors">Group Trip</Link></li>
              <li><Link to="/safety" className="hover:text-teal-500 transition-colors">Safety Hub</Link></li>
              <li><Link to="/assistant" className="hover:text-teal-500 transition-colors">AI Assistant</Link></li>
            </ul>
          </div>
        ) : (
          <div>
            <h4 className="font-display font-semibold mb-3 text-sm tracking-wide uppercase text-midnight-900/80 dark:text-white/80">Get Started</h4>
            <ul className="space-y-2 text-sm text-midnight-900/60 dark:text-white/50">
              <li><Link to="/login" className="hover:text-teal-500 transition-colors">Tourist Login</Link></li>
              <li><Link to="/register" className="hover:text-teal-500 transition-colors">Create Account</Link></li>
              <li><Link to="/contact" className="hover:text-teal-500 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        )}

        <div>
          <h4 className="font-display font-semibold mb-3 text-sm tracking-wide uppercase text-midnight-900/80 dark:text-white/80">Account</h4>
          <ul className="space-y-2 text-sm text-midnight-900/60 dark:text-white/50">
            {user ? (
              <>
                <li><Link to="/dashboard" className="hover:text-teal-500 transition-colors">Dashboard</Link></li>
                <li><Link to="/my-trips" className="hover:text-teal-500 transition-colors">My Trips</Link></li>
                <li><Link to="/contact" className="hover:text-teal-500 transition-colors">Contact Us</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="hover:text-teal-500 transition-colors">Login</Link></li>
                <li><Link to="/admin/login" className="hover:text-teal-500 transition-colors">Admin Login</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-midnight-900/10 dark:border-white/10 py-5 text-center text-xs text-midnight-900/50 dark:text-white/40">
        © {new Date().getFullYear()} TravelPilot · Smart India Hackathon 2025 · Built with React, Node.js &amp; MySQL
      </div>
    </footer>
  );
}
