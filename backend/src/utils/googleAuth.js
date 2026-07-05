// Verifies a Google Sign-In ID token using Google's own free tokeninfo
// endpoint (no client library needed, consistent with how this project
// calls other providers via plain fetch). Confirms the token is genuinely
// from Google AND was issued for this app's specific Client ID, before
// trusting any of the identity claims inside it.

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

async function verifyGoogleToken(idToken) {
  if (!GOOGLE_CLIENT_ID) {
    return { ok: false, error: 'google_not_configured' };
  }
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) return { ok: false, error: 'invalid_token' };
    const payload = await res.json();

    if (payload.aud !== GOOGLE_CLIENT_ID) {
      return { ok: false, error: 'audience_mismatch' };
    }
    if (!payload.email || payload.email_verified !== 'true') {
      return { ok: false, error: 'email_not_verified' };
    }

    return {
      ok: true,
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
    };
  } catch (err) {
    console.error('Google token verification failed:', err.message);
    return { ok: false, error: 'verification_failed' };
  }
}

module.exports = { verifyGoogleToken, isConfigured: () => !!GOOGLE_CLIENT_ID };
