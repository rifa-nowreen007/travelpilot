// Thin wrapper around Google's Gemini API for the client-side demo chat.
// The key is read from an env var at build time (never hardcoded) and is
// only used when no authenticated backend session exists — logged-in users
// are routed through the backend proxy instead (see api/axios + chatController),
// which keeps the key off the client entirely. See README "AI Chatbot setup".

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are the TravelPilot (SafarSaathi) AI Assistant, a friendly, concise travel companion for
tourists exploring India. Help with itinerary planning, packing lists, budgeting, safety tips,
local recommendations and eco-friendly travel choices. Keep replies short (2-5 sentences),
practical, and warm. Use INR (₹) for money. If asked something unrelated to travel, gently steer
back to how you can help with their trip.`;

export function isGeminiConfigured() {
  return Boolean(GEMINI_API_KEY);
}

/**
 * Sends the conversation to Gemini and returns the assistant's reply text.
 * `history` is an array of { sender: 'user' | 'assistant', message: string }.
 * Throws on failure — callers should catch and fall back to a local reply.
 */
export async function askGemini(history) {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not set');
  }

  const contents = history.map((m) => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.message }],
  }));

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
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) throw new Error('Empty response from Gemini');
  return text.trim();
}
