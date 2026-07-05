import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineExclamationCircle, HiOutlineShieldCheck } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/PageWrapper';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleError, setRoleError] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRoleError('');
    const res = await login(email, password);
    if (res.success) {
      if (res.user.role !== 'admin') {
        setRoleError('This account does not have administrator access.');
        return;
      }
      navigate('/admin');
    }
  };

  return (
    <PageWrapper>
      <section className="max-w-md mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-8 sm:p-10 border-t-4 border-t-sunset-500"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sunset-500/10 flex items-center justify-center text-sunset-500 text-2xl mb-4">
              <HiOutlineShieldCheck />
            </div>
            <h1 className="font-display text-2xl font-bold mb-1">Administrator Login</h1>
            <p className="text-sm text-midnight-900/55 dark:text-white/55">Restricted access — TravelPilot staff only</p>
          </div>

          {(error || roleError) && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3 mb-5">
              <HiOutlineExclamationCircle className="text-lg flex-shrink-0" /> {roleError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" className="input-field pl-11" />
            </div>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input-field pl-11" />
            </div>
            <button type="submit" disabled={loading} className="btn-accent w-full disabled:opacity-60">
              {loading ? 'Verifying…' : 'Access Admin Panel'}
            </button>
          </form>

          <p className="text-center text-sm text-midnight-900/60 dark:text-white/60 mt-6">
            <Link to="/login" className="text-teal-600 dark:text-teal-400 font-semibold">Back to tourist login</Link>
          </p>
        </motion.div>
      </section>
    </PageWrapper>
  );
}
