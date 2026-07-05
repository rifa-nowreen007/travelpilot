const { pool } = require('../config/db');

const EmergencyContactModel = {
  async findByUser(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    return rows;
  },

  async create({ userId, name, phone }) {
    const [result] = await pool.query(
      'INSERT INTO emergency_contacts (user_id, name, phone) VALUES (?, ?, ?)',
      [userId, name, phone]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM emergency_contacts WHERE id = ?', [id]);
    return rows[0];
  },

  async remove(id) {
    await pool.query('DELETE FROM emergency_contacts WHERE id = ?', [id]);
  },
};

module.exports = EmergencyContactModel;
