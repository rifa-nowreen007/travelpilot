// Receipt OCR via Groq's vision-capable model. Reuses the same
// GROQ_API_KEY already configured for the AI Assistant chat — no separate
// signup or key needed.
//
// Takes a data URL (e.g. "data:image/jpeg;base64,...") straight from a
// <input type="file"> read via FileReader on the frontend, and asks the
// model to return strict JSON describing the receipt.

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const EXTRACT_PROMPT = `You are a receipt-scanning assistant. Look at this receipt photo and extract:
- amount: the final total paid, as a plain number (no currency symbol, no commas)
- merchant: the shop/restaurant/vendor name, or null if unclear
- date: the date on the receipt in YYYY-MM-DD format, or null if not visible
- category: your best guess, one of exactly: food, transport, stay, shopping, activities, other

Respond with ONLY a raw JSON object, no markdown fences, no explanation. Example:
{"amount": 450, "merchant": "Cafe Coffee Day", "date": "2026-07-02", "category": "food"}
If you cannot read the receipt at all, respond with {"amount": null, "merchant": null, "date": null, "category": "other"}`;

async function scanReceipt(imageDataUrl) {
  if (!GROQ_API_KEY) {
    return { ok: false, error: 'groq_not_configured' };
  }
  if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
    return { ok: false, error: 'invalid_image' };
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACT_PROMPT },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`Groq vision API returned ${res.status}:`, errBody);
      return { ok: false, error: 'groq_request_failed' };
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || '';
    // Strip any accidental markdown fences before parsing.
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      ok: true,
      amount: parsed.amount ?? null,
      merchant: parsed.merchant ?? null,
      date: parsed.date ?? null,
      category: parsed.category ?? 'other',
    };
  } catch (err) {
    console.error('Receipt scan failed:', err.message);
    return { ok: false, error: 'parse_failed' };
  }
}

module.exports = { scanReceipt };
