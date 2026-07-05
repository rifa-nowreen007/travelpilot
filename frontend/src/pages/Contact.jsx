import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineUser, HiOutlineChatAlt, HiOutlineCheckCircle } from 'react-icons/hi';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState({ loading: false, sent: false, error: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, sent: false, error: '' });
    try {
      await api.post('/feedback', form);
      setStatus({ loading: false, sent: true, error: '' });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus({ loading: false, sent: false, error: err.response?.data?.message || 'Something went wrong. Please try again.' });
    }
  };

  return (
    <PageWrapper>
      <section className="max-w-3xl mx-auto px-6 lg:px-8 text-center pb-14">
        <span className="section-eyebrow">Get in touch</span>
        <h1 className="text-3xl sm:text-5xl font-bold mb-5">Contact &amp; Feedback</h1>
        <p className="text-midnight-900/60 dark:text-white/60">
          Questions about the project, or ideas to make TravelPilot better? We'd love to hear from you.
        </p>
      </section>

      <section className="max-w-xl mx-auto px-6 lg:px-8 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="card p-8 sm:p-10"
        >
          {status.sent ? (
            <div className="text-center py-6">
              <HiOutlineCheckCircle className="text-5xl text-teal-500 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">Message sent</h3>
              <p className="text-sm text-midnight-900/60 dark:text-white/60">Thanks for reaching out — we'll get back to you soon.</p>
              <button onClick={() => setStatus({ loading: false, sent: false, error: '' })} className="btn-secondary !text-midnight-900 dark:!text-white !bg-midnight-900/5 dark:!bg-white/10 mt-6">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status.error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3">{status.error}</div>
              )}
              <div className="relative">
                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
                <input name="name" required value={form.name} onChange={handleChange} placeholder="Your name" className="input-field pl-11" />
              </div>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
                <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="Your email" className="input-field pl-11" />
              </div>
              <div className="relative">
                <HiOutlineChatAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-900/40 dark:text-white/40" />
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject (optional)" className="input-field pl-11" />
              </div>
              <textarea name="message" required rows={5} value={form.message} onChange={handleChange} placeholder="Your message" className="input-field resize-none" />
              <button type="submit" disabled={status.loading} className="btn-primary w-full disabled:opacity-60">
                {status.loading ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </motion.div>
      </section>
    </PageWrapper>
  );
}
