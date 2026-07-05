const { pool } = require('../config/db');

const JournalModel = {
  async create({ tripId, userId, title, content, mood, entryDate, photoUrl }) {
    const [result] = await pool.query(
      `INSERT INTO journals (trip_id, user_id, title, content, mood, entry_date, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tripId, userId, title, content, mood || 'happy', entryDate, photoUrl || null]
    );
    return result.insertId;
  },

  async findByTrip(tripId) {
    const [rows] = await pool.query(
      'SELECT * FROM journals WHERE trip_id = ? ORDER BY entry_date DESC',
      [tripId]
    );
    return rows;
  },

  async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT j.*, t.title AS trip_title FROM journals j
       JOIN trips t ON j.trip_id = t.id
       WHERE j.user_id = ? ORDER BY j.entry_date DESC`,
      [userId]
    );
    return rows;
  },

  async highlights(userId) {
    const [rows] = await pool.query(
      `SELECT j.*, t.title AS trip_title FROM journals j
       JOIN trips t ON j.trip_id = t.id
       WHERE j.user_id = ? AND j.ai_highlight = TRUE
       ORDER BY j.entry_date DESC`,
      [userId]
    );
    return rows;
  },

  async remove(id) {
    await pool.query('DELETE FROM journals WHERE id = ?', [id]);
  },
};

module.exports = JournalModel;
