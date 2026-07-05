const { pool } = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findByGoogleId(googleId) {
    const [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, upi_id, avatar_url, emergency_contact, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  async create({ name, email, passwordHash, role = 'tourist', phone = null, googleId = null }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone, google_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, role, phone, googleId]
    );
    return result.insertId;
  },

  async linkGoogleId(userId, googleId) {
    await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, userId]);
  },

  // --- Password reset ---
  async setResetToken(userId, tokenHash, expiresAt) {
    await pool.query(
      'UPDATE users SET reset_token_hash = ?, reset_token_expires = ? WHERE id = ?',
      [tokenHash, expiresAt, userId]
    );
  },

  async findByValidResetToken(tokenHash) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE reset_token_hash = ? AND reset_token_expires > NOW()',
      [tokenHash]
    );
    return rows[0];
  },

  async resetPassword(userId, passwordHash) {
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, userId]
    );
  },

  async getAll() {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },

  async setActive(id, isActive) {
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
  },

  async remove(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  },

  async countAll() {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM users');
    return rows[0].total;
  },
};

module.exports = UserModel;
