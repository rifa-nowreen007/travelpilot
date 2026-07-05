import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX, HiSun, HiMoon, HiChevronDown } from 'react-icons/hi';
import { PiCompassRoseDuotone } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

// Keys map to translation strings in locales/<lang>/common.json under "nav".
const publicNavKeys = [
  { key: 'home', path: '/' },
  { key: 'contact', path: '/contact' },
];

// Split into "primary" (always inline) and "more" (tucked into a dropdown)
// so the bar never has to fit 10+ items on one line — that's what was
// pushing Logout off-screen before.
const privatePrimaryKeys = [
  { key: 'home', path: '/' },
  { key: 'dashboard', path: '/dashboard' },
  { key: 'tracking', path: '/tracking' },
  { key: 'group', path: '/group' },
  { key: 'memories', path: '/memories' },
];

const privateMoreKeys = [
  { key: 'itinerary', path: '/itinerary' },
  { key: 'chat', path: '/group-chat' },
  { key: 'packing', path: '/packing' },
  { key: 'safety', path: '/safety' },
  { key: 'assistant', path: '/assistant' },
  { key: 'contact', path: '/contact' },
];

const allPrivateKeys = [...privatePrimaryKeys, ...privateMoreKeys];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const moreRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the "More" and user dropdowns when clicking outside them.
  useEffect(() => {
    const onClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
    setUserMenuOpen(false);
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
      isActive
        ? 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
        : 'text-midnight-900/70 dark:text-white/70 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-500/5'
    }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-2' : 'py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          className={`flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all duration-300 ${
            scrolled ? 'glass-light dark:glass shadow-lg' : 'bg-transparent'
          }`}
        >
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <PiCompassRoseDuotone className="text-3xl text-teal-500 group-hover:rotate-45 transition-transform duration-500" />
            <span className="font-display font-bold text-lg text-midnight-900 dark:text-white">
              Travel<span className="text-teal-500">Pilot</span>
            </span>
          </Link>

          {user ? (
            <div className="hidden lg:flex items-center gap-0.5">
              {privatePrimaryKeys.map((link) => (
                <NavLink key={link.path} to={link.path} className={linkClass}>
                  {t(`nav.${link.key}`)}
                </NavLink>
              ))}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  className="px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-1 text-midnight-900/70 dark:text-white/70 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-500/5"
                >
                  More <HiChevronDown className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute left-0 mt-2 w-48 glass-light dark:glass rounded-2xl shadow-lg p-2 flex flex-col gap-0.5"
                    >
                      {privateMoreKeys.map((link) => (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          onClick={() => setMoreOpen(false)}
                          className={({ isActive }) =>
                            `px-3 py-2 rounded-xl text-sm font-medium ${
                              isActive
                                ? 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
                                : 'text-midnight-900/80 dark:text-white/80 hover:bg-teal-500/5'
                            }`
                          }
                        >
                          {t(`nav.${link.key}`)}
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1">
              {publicNavKeys.map((link) => (
                <NavLink key={link.path} to={link.path} className={linkClass}>
                  {t(`nav.${link.key}`)}
                </NavLink>
              ))}
            </div>
          )}

          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher compact />
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-full text-midnight-900/70 dark:text-white/70 hover:bg-teal-500/10 hover:text-teal-500 transition-colors flex-shrink-0"
            >
              {theme === 'dark' ? <HiSun className="text-xl" /> : <HiMoon className="text-xl" />}
            </button>
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-teal-500/10 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-sunset-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </span>
                  <span className="text-sm font-semibold text-midnight-900 dark:text-white max-w-[7rem] truncate">
                    {user.name?.split(' ')[0]}
                  </span>
                  <HiChevronDown className={`text-xs transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 mt-2 w-44 glass-light dark:glass rounded-2xl shadow-lg p-2 flex flex-col gap-0.5"
                    >
                      <Link
                        to={user.role === 'admin' ? '/admin' : '/dashboard'}
                        onClick={() => setUserMenuOpen(false)}
                        className="px-3 py-2 rounded-xl text-sm font-medium text-midnight-900/80 dark:text-white/80 hover:bg-teal-500/5"
                      >
                        {t('nav.dashboard')}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="text-left px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10"
                      >
                        {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-midnight-900 dark:text-white hover:text-teal-500 transition-colors flex-shrink-0">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary !py-2 !px-5 text-sm flex-shrink-0">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden text-2xl text-midnight-900 dark:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <HiX /> : <HiMenu />}
          </button>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="lg:hidden mt-2 glass-light dark:glass rounded-2xl overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-1 max-h-[70vh] overflow-y-auto">
                {(user ? allPrivateKeys : publicNavKeys).map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-xl text-sm font-semibold ${
                        isActive
                          ? 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
                          : 'text-midnight-900 dark:text-white/80'
                      }`
                    }
                  >
                    {t(`nav.${link.key}`)}
                  </NavLink>
                ))}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-midnight-900/60 dark:text-white/60">{t('nav.theme')}</span>
                  <button onClick={toggleTheme} className="p-2 rounded-full bg-teal-500/10 text-teal-500">
                    {theme === 'dark' ? <HiSun className="text-xl" /> : <HiMoon className="text-xl" />}
                  </button>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-midnight-900/60 dark:text-white/60">{t('common.language')}</span>
                  <LanguageSwitcher />
                </div>
                {user ? (
                  <div className="flex flex-col gap-2 px-4 pt-2">
                    <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)} className="btn-primary text-sm">
                      {t('nav.dashboard')}
                    </Link>
                    <button onClick={handleLogout} className="btn-secondary !text-midnight-900 dark:!text-white !bg-midnight-900/5 dark:!bg-white/10 text-sm">
                      {t('nav.logout')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-4 pt-2">
                    <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary !text-midnight-900 dark:!text-white !bg-midnight-900/5 dark:!bg-white/10 text-sm">
                      {t('nav.login')}
                    </Link>
                    <Link to="/register" onClick={() => setOpen(false)} className="btn-primary text-sm">
                      {t('nav.register')}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
