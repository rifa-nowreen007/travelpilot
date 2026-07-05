const { pool } = require('../config/db');

const TripMemberModel = {
  // Members joined with the linked user's name/phone when they have an
  // account, falling back to the invite_name/invite_phone captured at
  // invite time for people who don't have a TravelPilot account yet.
  async findByTrip(tripId) {
    const [rows] = await pool.query(
      `SELECT tm.*, u.name AS user_name, u.phone AS user_phone
       FROM trip_members tm
       LEFT JOIN users u ON tm.user_id = u.id
       WHERE tm.trip_id = ?
       ORDER BY tm.role = 'owner' DESC, tm.joined_at ASC`,
      [tripId]
    );
    return rows;
  },

  async findByTripAndUser(tripId, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM trip_members WHERE trip_id = ? AND user_id = ?',
      [tripId, userId]
    );
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM trip_members WHERE id = ?', [id]);
    return rows[0];
  },

  // Invites by phone. If an existing user already registered with that
  // phone number, links the invite straight to their account so it shows
  // up for them immediately; otherwise it's held against invite_name /
  // invite_phone until they sign up.
  async invite({ tripId, inviteName, invitePhone }) {
    const [users] = await pool.query('SELECT id, name FROM users WHERE phone = ?', [invitePhone]);
    const matchedUser = users[0];

    const [result] = await pool.query(
      `INSERT INTO trip_members (trip_id, user_id, invite_name, invite_phone, role, status)
       VALUES (?, ?, ?, ?, 'member', 'invited')`,
      [tripId, matchedUser ? matchedUser.id : null, inviteName, invitePhone]
    );
    return { id: result.insertId, matchedUser: matchedUser || null };
  },

  async setLocationShared(tripId, userId, shared) {
    await pool.query(
      `UPDATE trip_members SET location_shared = ? WHERE trip_id = ? AND user_id = ?`,
      [!!shared, tripId, userId]
    );
  },

  async setUpiId(tripId, userId, upiId) {
    await pool.query(
      `UPDATE trip_members SET upi_id = ? WHERE trip_id = ? AND user_id = ?`,
      [upiId || null, tripId, userId]
    );
  },

  async markStatus(id, status) {
    await pool.query('UPDATE trip_members SET status = ? WHERE id = ?', [status, id]);
  },

  // Called right after someone registers: any trip invite sent to this
  // phone number before they had an account gets linked to their new
  // account, so the trip immediately shows up for them and they can join
  // its group chat.
  async linkPendingInvitesByPhone(userId, phone) {
    if (!phone) return 0;
    const [result] = await pool.query(
      `UPDATE trip_members SET user_id = ? WHERE invite_phone = ? AND user_id IS NULL`,
      [userId, phone]
    );
    return result.affectedRows;
  },

  async remove(id) {
    await pool.query('DELETE FROM trip_members WHERE id = ?', [id]);
  },
};

module.exports = TripMemberModel;
