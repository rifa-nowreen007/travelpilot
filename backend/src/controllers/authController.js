const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const TripMemberModel = require('../models/tripMemberModel');
const { sendPasswordResetEmail, isConfigured: mailerConfigured } = require('../utils/mailer');
const { verifyGoogleToken } = require('../utils/googleAuth');
require('dotenv').config();

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Public registration is always tourist - admins are seeded/created separately
    const userId = await UserModel.create({ name, email, passwordHash, role: 'tourist', phone });

    // If a friend already invited this phone number to a trip before this
    // person had an account, connect it now so the trip (and its group
    // chat) shows up for them right away.
    if (phone) {
      await TripMemberModel.linkPendingInvitesByPhone(userId, phone).catch((err) =>
        console.error('Failed to link pending trip invites:', err.message)
      );
    }

    const user = await UserModel.findById(userId);
    const token = signToken(user);

    res.status(201).json({ success: true, message: 'Account created successfully', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user);
    delete user.password_hash;

    res.json({ success: true, message: 'Login successful', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// POST /api/auth/google  { idToken }
// Signs in an existing account (matched by Google ID first, then by
// email) or creates a brand-new tourist account — no password is ever
// set for a Google-created account, so password login stays impossible
// for it unless they later use "Forgot password" to set one deliberately.
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required' });
    }

    const verified = await verifyGoogleToken(idToken);
    if (!verified.ok) {
      const message =
        verified.error === 'google_not_configured'
          ? 'Google Sign-In is not configured on the server yet'
          : 'Could not verify that Google sign-in — please try again';
      return res.status(401).json({ success: false, message });
    }

    let user = await UserModel.findByGoogleId(verified.googleId);

    if (!user) {
      const existingByEmail = await UserModel.findByEmail(verified.email);
      if (existingByEmail) {
        // Same email already has a password account — link Google to it
        // rather than creating a confusing duplicate.
        await UserModel.linkGoogleId(existingByEmail.id, verified.googleId);
        user = existingByEmail;
      } else {
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        const userId = await UserModel.create({
          name: verified.name,
          email: verified.email,
          passwordHash,
          role: 'tourist',
          googleId: verified.googleId,
        });
        user = await UserModel.findById(userId);
      }
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    const token = signToken(user);
    delete user.password_hash;

    res.json({ success: true, message: 'Signed in with Google', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during Google sign-in' });
  }
};

// POST /api/auth/forgot-password  { email }
// Always responds with the same generic message regardless of whether the
// email exists, so this endpoint can't be used to check who has an
// account. Actual email delivery gracefully no-ops (and logs the link to
// the console) if SMTP isn't configured, so this stays testable locally
// without a real mail account.
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const genericResponse = {
      success: true,
      message: "If an account exists for that email, we've sent a password reset link.",
    };

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await UserModel.setResetToken(user.id, tokenHash, expiresAt);

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
    const result = await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

    // Dev convenience only: if there's no SMTP configured, hand back the
    // link directly so the flow is still testable without a mail account.
    // Never include this in a real deployment.
    if (!result.ok && process.env.NODE_ENV !== 'production') {
      return res.json({ ...genericResponse, devResetUrl: resetUrl });
    }

    res.json(genericResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error requesting password reset' });
  }
};

// POST /api/auth/reset-password/:token  { password }
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await UserModel.findByValidResetToken(tokenHash);
    if (!user) {
      return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await UserModel.resetPassword(user.id, passwordHash);

    res.json({ success: true, message: 'Password reset successfully — you can now log in' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
};

// GET /api/auth/me
exports.getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};
