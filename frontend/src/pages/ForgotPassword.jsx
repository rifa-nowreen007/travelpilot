import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineCheckCircle } from 'react-icons/hi';
import { PiCompassRoseDuotone } from 'react-icons/pi';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // { message, devResetUrl? }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setStatus(data);
    } catch {
      setStatus({ message: 'Something went wrong — please try again.' });
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
            <h1 className="font-display text-2xl font-bold mb-1">Reset your password</h1>
            <p className="text-sm text-midnight-900/55 dark:text-white/55">Enter your account email and we'll send you a reset link</p>
          </div>

          {status ? (
            <div className="text-center space-y-4">
              <HiOutlineCheckCircle className="text-4xl text-teal-500 mx-auto" />
              <p className="text-sm text-midnight-900/70 dark:text-white/70">{status.message}</p>
              {status.devResetUrl && (
                <div className="text-left bg-midnight-900/5 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-midnight-900/50 dark:text-white/50 mb-2">
                    No email server configured yet — for local testing only, here's your reset link:
                  </p>
                  <Link to={status.devResetUrl.replace(window.location.origin, '')} className="text-xs text-teal-600 dark:text-teal-400 break-all">
                    {status.devResetUrl}
                  </Link>
                </div>
              )}
              <Link to="/login" className="text-teal-600 dark:text-teal-400 font-semibold text-sm inline-block">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address" className="input-field pl-11"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-midnight-900/60 dark:text-white/60">
                <Link to="/login" className="text-teal-600 dark:text-teal-400 font-semibold">Back to login</Link>
              </p>
            </form>
          )}
        </motion.div>
      </section>
    </PageWrapper>
  );
}
