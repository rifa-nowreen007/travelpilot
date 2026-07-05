import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineSparkles, HiOutlinePaperAirplane, HiOutlineRefresh } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import { generateDemoReply, SUGGESTED_PROMPTS } from '../lib/aiReplies';
import { askGemini, isGeminiConfigured } from '../lib/gemini';

const WELCOME = {
  sender: 'assistant',
  message: "Hi! I'm your TravelPilot AI Assistant. I can help plan itineraries, estimate budgets, suggest eco-friendly options, and answer safety questions for your next trip. What are you planning?",
};

export default function AIAssistant() {
  const { user } = useAuth();
  const isDemo = !user || user.demo;
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value) return;
    const nextHistory = [...messages, { sender: 'user', message: value }];
    setMessages(nextHistory);
    setInput('');
    setTyping(true);

    // Logged-in users: backend proxies Gemini with a server-side key.
    if (!isDemo) {
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

    // Demo/guest: call Gemini directly using VITE_GEMINI_API_KEY when set.
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
    }, 700 + Math.random() * 600);
  };

  const reset = () => setMessages([WELCOME]);

  return (
    <PageWrapper>
      <section className="max-w-4xl mx-auto px-6 lg:px-8 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="section-eyebrow">AI Travel Assistant</span>
            <h1 className="text-3xl font-bold">Ask TravelPilot anything</h1>
          </div>
          <button onClick={reset} className="btn-secondary !text-midnight-900 dark:!text-white !bg-midnight-900/5 dark:!bg-white/10 !py-2 !px-4 text-sm">
            <HiOutlineRefresh /> Reset chat
          </button>
        </div>

        <div className="card flex flex-col h-[65vh] min-h-[480px] overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-midnight-900 to-midnight-700 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center">
              <HiOutlineSparkles className="text-teal-400" />
            </div>
            <div>
              <p className="text-white font-display font-semibold text-sm">TravelPilot AI</p>
              <p className="text-white/50 text-xs">Trained on itineraries, safety & budgeting</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-teal-500 text-white rounded-br-sm'
                    : 'bg-midnight-900/5 dark:bg-white/10 text-midnight-900 dark:text-white rounded-bl-sm'
                }`}>
                  {m.message}
                </div>
              </motion.div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="px-5 py-3.5 rounded-2xl rounded-bl-sm bg-midnight-900/5 dark:bg-white/10 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button key={p} onClick={() => send(p)}
                    className="text-sm px-4 py-2 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-4 border-t border-midnight-900/10 dark:border-white/10 flex items-center gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about packing, budgets, safety, itineraries…"
              className="flex-1 px-5 py-3 rounded-full bg-midnight-900/5 dark:bg-white/10 text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button type="submit" className="w-11 h-11 flex-shrink-0 rounded-full bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors">
              <HiOutlinePaperAirplane className="text-lg rotate-90" />
            </button>
          </form>
        </div>
      </section>
    </PageWrapper>
  );
}
