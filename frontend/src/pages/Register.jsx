import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone, HiOutlineExclamationCircle } from 'react-icons/hi';
import { PiCompassRoseDuotone } from 'react-icons/pi';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/PageWrapper';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(form);
    if (res.success) navigate('/dashboard');
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
            <h1 className="font-display text-2xl font-bold mb-1">Create your account</h1>
            <p className="text-sm text-midnight-900/55 dark:text-white/55">Start planning smarter trips today</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3 mb-5">
              <HiOutlineExclamationCircle className="text-lg flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
              <input name="name" required value={form.name} onChange={handleChange} placeholder="Full name" className="input-field pl-11" />
            </div>
            <div className="relative">
              <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
              <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="Email address" className="input-field pl-11" />
            </div>
            <div className="relative">
              <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number (optional)" className="input-field pl-11" />
            </div>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
              <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="Password (min. 6 characters)" className="input-field pl-11" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-midnight-900/10 dark:bg-white/10" />
            <span className="text-xs text-midnight-900/40 dark:text-white/40">or</span>
            <div className="flex-1 h-px bg-midnight-900/10 dark:bg-white/10" />
          </div>
          <GoogleSignInButton onSuccess={() => navigate('/dashboard')} />

          <p className="text-center text-sm text-midnight-900/60 dark:text-white/60 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 dark:text-teal-400 font-semibold">Log in</Link>
          </p>
        </motion.div>
      </section>
    </PageWrapper>
  );
}
