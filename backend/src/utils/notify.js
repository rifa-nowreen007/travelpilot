// Real SMS / WhatsApp delivery via Twilio.
//
// Uses only global fetch + Twilio's plain REST API, so no extra npm
// dependency is required beyond what's already in package.json.
//
// Same pattern as the Gemini integration in chatController.js: if the
// credentials aren't set, every function here safely no-ops and logs to the
// console instead of throwing, so the rest of the app (SOS, invites) keeps
// working end-to-end during development. Once real Twilio credentials are
// added to backend/.env, messages actually go out.
//
// Required env vars (see backend/.env.example):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_SMS_FROM        e.g. +1415XXXXXXX  (a Twilio phone number)
//   TWILIO_WHATSAPP_FROM   e.g. whatsapp:+14155238886 (Twilio sandbox number)

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_SMS_FROM,
  TWILIO_WHATSAPP_FROM,
} = process.env;

const configured = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);

function authHeader() {
  return 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
}

// Sends one message. channel = 'sms' | 'whatsapp'. `to` should be E.164
// format, e.g. +919876543210. Returns { ok, sid?, error? } — never throws,
// so a failed message to one contact never blocks the others.
async function sendMessage({ to, body, channel = 'sms' }) {
  if (!to) return { ok: false, error: 'missing_recipient' };

  if (!configured) {
    console.log(`[notify] (Twilio not configured — would send ${channel} to ${to}): ${body}`);
    return { ok: false, error: 'twilio_not_configured' };
  }

  const from = channel === 'whatsapp' ? TWILIO_WHATSAPP_FROM : TWILIO_SMS_FROM;
  if (!from) {
    console.log(`[notify] (No TWILIO_${channel.toUpperCase()}_FROM set — would send to ${to}): ${body}`);
    return { ok: false, error: `twilio_${channel}_from_not_configured` };
  }

  const toAddr = channel === 'whatsapp' && !to.startsWith('whatsapp:') ? `whatsapp:${to}` : to;

  try {
    const params = new URLSearchParams({ To: toAddr, From: from, Body: body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error('[notify] Twilio error:', data.message || data);
      return { ok: false, error: data.message || 'twilio_error' };
    }
    return { ok: true, sid: data.sid };
  } catch (err) {
    console.error('[notify] Send failed:', err.message);
    return { ok: false, error: err.message };
  }
}

// Sends the same message to a list of contacts (used for SOS fan-out).
// Tries WhatsApp first when requested, falls back to SMS per-contact so a
// missing WhatsApp opt-in never means the contact hears nothing at all.
async function notifyContacts(contacts, body, { preferWhatsApp = true } = {}) {
  const results = await Promise.all(
    contacts.map(async (c) => {
      if (preferWhatsApp) {
        const wa = await sendMessage({ to: c.phone, body, channel: 'whatsapp' });
        if (wa.ok) return { ...c, ...wa, channel: 'whatsapp' };
      }
      const sms = await sendMessage({ to: c.phone, body, channel: 'sms' });
      return { ...c, ...sms, channel: 'sms' };
    })
  );
  return results;
}

module.exports = { sendMessage, notifyContacts, isConfigured: () => configured };
