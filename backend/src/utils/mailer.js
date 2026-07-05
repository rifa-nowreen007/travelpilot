// Sends the "reset your password" email via any standard SMTP account
// (Gmail with an App Password is the easiest free option — see
// backend/.env.example for setup steps).
//
// Same graceful-fallback pattern used for Twilio/Groq elsewhere in this
// app: if SMTP isn't configured, the reset link is just logged to the
// server console instead of emailed, so local development/testing never
// gets blocked on having a mail account set up.

const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

const configured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (configured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const subject = 'Reset your TravelPilot password';
  const text = `Hi ${name},\n\nSomeone requested a password reset for your TravelPilot account. Click the link below to set a new password (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;

  if (!configured) {
    console.log(`[mailer] (SMTP not configured — would email ${to}): ${resetUrl}`);
    return { ok: false, error: 'smtp_not_configured' };
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      subject,
      text,
    });
    return { ok: true };
  } catch (err) {
    console.error('[mailer] Send failed:', err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendPasswordResetEmail, isConfigured: () => configured };
