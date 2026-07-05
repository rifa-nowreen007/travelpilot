const { pool } = require('../config/db');

const GroupMessageModel = {
  async create({ tripId, userId, message, photoUrl }) {
    const [result] = await pool.query(
      `INSERT INTO group_messages (trip_id, user_id, message, photo_url) VALUES (?, ?, ?, ?)`,
      [tripId, userId, message || null, photoUrl || null]
    );
    return result.insertId;
  },

  // Most recent `limit` messages, returned oldest-first so they render
  // top-to-bottom like a normal chat log.
  async findByTrip(tripId, limit = 200) {
    const [rows] = await pool.query(
      `SELECT gm.id, gm.trip_id, gm.user_id, gm.message, gm.photo_url, gm.created_at, u.name AS sender_name
       FROM group_messages gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.trip_id = ?
       ORDER BY gm.created_at DESC
       LIMIT ?`,
      [tripId, limit]
    );
    return rows.reverse();
  },
};

module.exports = GroupMessageModel;
