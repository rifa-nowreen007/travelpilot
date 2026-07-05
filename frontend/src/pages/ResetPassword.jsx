import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineLockClosed, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi';
import { PiCompassRoseDuotone } from 'react-icons/pi';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'That reset link is invalid or has expired.');
    } finally {
      setLoading(false);
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
            <h1 className="font-display text-2xl font-bold mb-1">Set a new password</h1>
            <p className="text-sm text-midnight-900/55 dark:text-white/55">Choose a new password for your account</p>
          </div>

          {done ? (
            <div className="text-center space-y-3">
              <HiOutlineCheckCircle className="text-4xl text-teal-500 mx-auto" />
              <p className="text-sm text-midnight-900/70 dark:text-white/70">Password reset — taking you to login…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3 mb-5">
                  <HiOutlineExclamationCircle className="text-lg flex-shrink-0" /> {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
                  <input
                    type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password (min. 6 characters)" className="input-field pl-11"
                  />
                </div>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
                  <input
                    type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password" className="input-field pl-11"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                  {loading ? 'Saving…' : 'Reset password'}
                </button>
              </form>
              <p className="text-center text-sm text-midnight-900/60 dark:text-white/60 mt-6">
                <Link to="/login" className="text-teal-600 dark:text-teal-400 font-semibold">Back to login</Link>
              </p>
            </>
          )}
        </motion.div>
      </section>
    </PageWrapper>
  );
}
