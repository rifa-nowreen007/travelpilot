const { pool } = require('../config/db');

const ExpenseModel = {
  async create({ tripId, userId, paidByMemberId, category, amount, description, expenseDate, isOcrScanned, receiptImage }) {
    const [result] = await pool.query(
      `INSERT INTO expenses (trip_id, user_id, paid_by_member_id, category, amount, description, expense_date, is_ocr_scanned, receipt_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tripId, userId || null, paidByMemberId || null, category || 'other', amount, description || null, expenseDate, !!isOcrScanned, receiptImage || null]
    );
    return result.insertId;
  },

  // Includes the payer's display name, whether that's the trip owner
  // (via user_id) or any other trip member (via paid_by_member_id),
  // registered or invited-only.
  async findByTrip(tripId) {
    const [rows] = await pool.query(
      `SELECT e.*,
              COALESCE(tm.user_name_resolved, u.name, tm.invite_name) AS paid_by_name
       FROM expenses e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN (
         SELECT tm.id, COALESCE(mu.name, tm.invite_name) AS user_name_resolved
         FROM trip_members tm
         LEFT JOIN users mu ON tm.user_id = mu.id
       ) tm ON e.paid_by_member_id = tm.id
       WHERE e.trip_id = ?
       ORDER BY e.expense_date DESC, e.created_at DESC`,
      [tripId]
    );
    return rows;
  },

  async findByUser(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC',
      [userId]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
    return rows[0];
  },

  async update(id, fields) {
    const allowed = ['category', 'amount', 'description', 'expense_date', 'receipt_image'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (!sets.length) return;
    values.push(id);
    await pool.query(`UPDATE expenses SET ${sets.join(', ')} WHERE id = ?`, values);
  },

  async remove(id) {
    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
  },

  async totalByTrip(tripId) {
    const [rows] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE trip_id = ?',
      [tripId]
    );
    return rows[0].total;
  },

  async categoryBreakdown(tripId) {
    const [rows] = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM expenses WHERE trip_id = ? GROUP BY category`,
      [tripId]
    );
    return rows;
  },

  // Per-member totals for this trip, used to compute real split balances.
  async totalsByMember(tripId) {
    const [rows] = await pool.query(
      `SELECT paid_by_member_id, COALESCE(SUM(amount), 0) AS total
       FROM expenses WHERE trip_id = ? AND paid_by_member_id IS NOT NULL
       GROUP BY paid_by_member_id`,
      [tripId]
    );
    return rows;
  },
};

module.exports = ExpenseModel;
