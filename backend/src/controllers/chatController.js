const ChatModel = require('../models/chatModel');

const SYSTEM_PROMPT = `You are the TravelPilot (SafarSaathi) AI Assistant, a friendly, concise travel companion for
tourists exploring India. Help with itinerary planning, packing lists, budgeting, safety tips,
local recommendations and eco-friendly travel choices. Keep replies short (2-5 sentences),
practical, and warm. Use INR (₹) for money. If asked something unrelated to travel, gently steer
back to how you can help with their trip.`;

// ---------------------------------------------------------------------
// Provider 1: Groq (primary) — OpenAI-compatible, no billing required,
// and a far more workable free-tier daily quota than Gemini's free tier.
// Returns null if no key is configured or the call fails, so the caller
// falls through to the next provider.
// ---------------------------------------------------------------------
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'openai/gpt-oss-120b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function generateGroqReply(message, recentHistory = []) {
  if (!GROQ_API_KEY) return null;
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory.map((h) => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.message,
      })),
      { role: 'user', content: message },
    ];

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`Groq API returned ${res.status}:`, errBody);
      return null;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return text.trim() || null;
  } catch (err) {
    console.error('Groq API call failed:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------
// Provider 2: Gemini (secondary fallback) — kept as a second free-tier
// option so a Groq outage or an exhausted Groq quota doesn't immediately
// drop to the offline assistant. Only called if GROQ didn't answer.
// ---------------------------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function generateGeminiReply(message, recentHistory = []) {
  if (!GEMINI_API_KEY) return null;
  try {
    const contents = [
      ...recentHistory.map((h) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.message }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 300 },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`Gemini API returned ${res.status}:`, errBody);
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    return text.trim() || null;
  } catch (err) {
    console.error('Gemini API call failed:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------
// Provider 3: offline rule-based assistant — used only if neither Groq
// nor Gemini is configured/available, so the chat always responds
// instantly with something useful.
// ---------------------------------------------------------------------
function generateReply(message) {
  const m = message.toLowerCase();

  if (/(pack|luggage|carry|bring)/.test(m)) {
    return "For most Indian trips: breathable cottons, a rain layer between June-September, a power bank, and copies of your ID. Tell me your destination and I'll tailor the list further.";
  }
  if (/(budget|cost|expense|cheap|money)/.test(m)) {
    return 'A comfortable mid-range trip in India usually runs ₹2,000–3,500/day per person including stay, food and local transport. Want me to break that down for a specific destination?';
  }
  if (/(safe|safety|sos|emergency)/.test(m)) {
    return "Safety first — keep the SOS button one tap away, share your live trip with a trusted contact, and avoid isolated trails after dark. TravelPilot auto-alerts your emergency contact if you're inactive for too long on a tracked route.";
  }
  if (/(eco|sustainab|green|carbon)/.test(m)) {
    return 'Trains and buses score far higher on our Eco Score than flights or private cars. Choosing a train over a short-haul flight can cut your trip emissions by up to 80%.';
  }
  if (/(itinerary|plan|schedule|days)/.test(m)) {
    return "I can sketch a day-by-day plan — just tell me the destination, number of days, and whether you prefer adventure, relaxation, or culture-focused stops.";
  }
  if (/(weather|climate|rain|season)/.test(m)) {
    return 'Hill destinations like Manali and Rishikesh are pleasant March–June and September–November, and best avoided during peak monsoon landslides (July–August).';
  }
  if (/(hi|hello|hey)/.test(m)) {
    return "Hey traveller! I'm your TravelPilot AI Assistant — ask me about itineraries, packing, budgets, safety, or local recommendations.";
  }
  if (/(hour|how long|distance|far|km|kilometre|kilometer)/.test(m)) {
    return "I don't have live traffic/route data built in yet, but as a rule of thumb across India: budget roughly 45-55 km/hour average on highways including stops. Tell me the two cities and I can give a rough estimate.";
  }
  return "Got it — noted. I can help with itinerary planning, packing lists, budgeting, safety tips, and eco-friendly travel options. What would you like to dig into?";
}

// GET /api/chat/history
exports.getHistory = async (req, res) => {
  try {
    const history = await ChatModel.history(req.user.id);
    res.json({ success: true, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
};

// POST /api/chat/message
exports.sendMessage = async (req, res) => {
  try {
    const { message, tripId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }
    await ChatModel.log({ userId: req.user.id, tripId, sender: 'user', message });

    // Pull a little recent context so the model has conversational continuity.
    const history = await ChatModel.history(req.user.id).catch(() => []);
    const recentHistory = (history || []).slice(-8);

    const reply =
      (await generateGroqReply(message, recentHistory)) ||
      (await generateGeminiReply(message, recentHistory)) ||
      generateReply(message);

    await ChatModel.log({ userId: req.user.id, tripId, sender: 'assistant', message: reply });
    res.json({ success: true, reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to process message' });
  }
};
