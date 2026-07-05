const { pool } = require('../config/db');

const ChatModel = {
  async log({ userId, tripId, sender, message }) {
    const [result] = await pool.query(
      'INSERT INTO chat_messages (user_id, trip_id, sender, message) VALUES (?, ?, ?, ?)',
      [userId, tripId || null, sender, message]
    );
    return result.insertId;
  },

  async history(userId, limit = 50) {
    const [rows] = await pool.query(
      'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT ?',
      [userId, limit]
    );
    return rows;
  },
};

module.exports = ChatModel;
