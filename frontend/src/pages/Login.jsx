import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineExclamationCircle } from 'react-icons/hi';
import { PiCompassRoseDuotone } from 'react-icons/pi';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/PageWrapper';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.success) {
      navigate(res.user.role === 'admin' ? '/admin' : '/dashboard');
    }
  };

  return (
    <PageWrapper>
      <section className="max-w-md mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-8 sm:p-10"
        >
          <div className="text-center mb-8">
            <PiCompassRoseDuotone className="text-4xl text-teal-500 mx-auto mb-3" />
            <h1 className="font-display text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-sm text-midnight-900/55 dark:text-white/55">Log in to your TravelPilot account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3 mb-5">
              <HiOutlineExclamationCircle className="text-lg flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" className="input-field pl-11"
              />
            </div>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" className="input-field pl-11"
              />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-teal-600 dark:text-teal-400 font-medium">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-midnight-900/10 dark:bg-white/10" />
            <span className="text-xs text-midnight-900/40 dark:text-white/40">or</span>
            <div className="flex-1 h-px bg-midnight-900/10 dark:bg-white/10" />
          </div>
          <GoogleSignInButton onSuccess={(user) => navigate(user.role === 'admin' ? '/admin' : '/dashboard')} />

          <p className="text-center text-sm text-midnight-900/60 dark:text-white/60 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-600 dark:text-teal-400 font-semibold">Sign up</Link>
          </p>
          <p className="text-center text-xs text-midnight-900/40 dark:text-white/40 mt-3">
            Are you an administrator? <Link to="/admin/login" className="text-teal-600 dark:text-teal-400">Admin login</Link>
          </p>
        </motion.div>
      </section>
    </PageWrapper>
  );
}
