import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChatAlt2, HiOutlineX, HiOutlinePaperAirplane, HiOutlineSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { generateDemoReply, SUGGESTED_PROMPTS } from '../lib/aiReplies';
import { askGemini, isGeminiConfigured } from '../lib/gemini';

/**
 * Floating AI Assistant button, present on every page once a user session
 * (real or demo) exists. Mirrors the full /assistant page in miniature.
 */
export default function AIChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'assistant', message: "Hi! I'm your TravelPilot AI Assistant. Ask me about itineraries, packing, budgets, or safety." },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, open]);

  if (!user) return null; // Widget only appears once someone is in a (demo or real) session

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value) return;
    const nextHistory = [...messages, { sender: 'user', message: value }];
    setMessages(nextHistory);
    setInput('');
    setTyping(true);

    // Logged-in users: route through the backend, which proxies Gemini with
    // a server-side key (never exposed to the browser). Falls back to the
    // rule-based reply if the backend/API call fails.
    if (!user.demo) {
      try {
        const { data } = await api.post('/chat/message', { message: value });
        setMessages((m) => [...m, { sender: 'assistant', message: data.reply }]);
      } catch {
        setMessages((m) => [...m, { sender: 'assistant', message: generateDemoReply(value) }]);
      } finally {
        setTyping(false);
      }
      return;
    }

    // Demo/guest session: call Gemini directly from the browser using
    // VITE_GEMINI_API_KEY when configured, otherwise use the offline
    // rule-based assistant so the widget still feels alive.
    if (isGeminiConfigured()) {
      try {
        const reply = await askGemini(nextHistory);
        setMessages((m) => [...m, { sender: 'assistant', message: reply }]);
      } catch {
        setMessages((m) => [...m, { sender: 'assistant', message: generateDemoReply(value) }]);
      } finally {
        setTyping(false);
      }
      return;
    }

    setTimeout(() => {
      setMessages((m) => [...m, { sender: 'assistant', message: generateDemoReply(value) }]);
      setTyping(false);
    }, 600 + Math.random() * 500);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[70] w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-xl shadow-teal-500/30 flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        {open ? <HiOutlineX className="text-2xl" /> : <HiOutlineChatAlt2 className="text-2xl" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 z-[70] w-[92vw] max-w-sm h-[70vh] max-h-[560px] glass dark:glass rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/20 bg-white/95 dark:bg-midnight-900/95"
          >
            <div className="px-5 py-4 bg-gradient-to-r from-midnight-900 to-midnight-700 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center">
                <HiOutlineSparkles className="text-teal-400 text-lg" />
              </div>
              <div>
                <p className="text-white font-display font-semibold text-sm">TravelPilot AI</p>
                <p className="text-white/50 text-xs">Always-on trip assistant</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-teal-500 text-white rounded-br-sm'
                      : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900 dark:text-white rounded-bl-sm'
                  }`}>
                    {m.message}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-midnight-900/5 dark:bg-white/10 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button key={p} onClick={() => send(p)}
                      className="text-xs px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-colors text-left">
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="p-3 border-t border-midnight-900/10 dark:border-white/10 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your trip…"
                className="flex-1 px-4 py-2.5 rounded-full bg-midnight-900/5 dark:bg-white/10 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button type="submit" className="w-10 h-10 flex-shrink-0 rounded-full bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors">
                <HiOutlinePaperAirplane className="text-lg rotate-90" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
