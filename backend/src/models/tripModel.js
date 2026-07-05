const { pool } = require('../config/db');

// Derives what a trip's status *should* be right now from its dates, so
// "Ongoing" / "Completed" reflect reality instead of staying stuck on
// "Planned" forever. Never overrides a manually-set 'cancelled' trip.
function computeStatus(trip) {
  if (trip.status === 'cancelled') return trip.status;
  const today = new Date().toISOString().slice(0, 10);
  const start = new Date(trip.start_date).toISOString().slice(0, 10);
  const end = new Date(trip.end_date).toISOString().slice(0, 10);
  if (today < start) return 'planned';
  if (today > end) return 'completed';
  return 'ongoing';
}

// Applies computeStatus() to a row and persists the change if it drifted
// (e.g. a trip's end date has now passed since it was last read).
async function withFreshStatus(trip) {
  if (!trip) return trip;
  const nextStatus = computeStatus(trip);
  if (nextStatus !== trip.status) {
    await pool.query('UPDATE trips SET status = ? WHERE id = ?', [nextStatus, trip.id]);
    trip.status = nextStatus;
  }
  return trip;
}

const TripModel = {
  async create({ userId, title, destination, destLat, destLng, startDate, endDate, budget, autoTracked }) {
    const [result] = await pool.query(
      `INSERT INTO trips (user_id, title, destination, dest_lat, dest_lng, start_date, end_date, budget, auto_tracked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, destination, destLat ?? null, destLng ?? null, startDate, endDate, budget || 0, !!autoTracked]
    );
    return result.insertId;
  },

  // Every trip the user is connected to — either as the owner or as an
  // invited/joined member. Trip owners already get a 'joined' trip_members
  // row when the trip is created, so a single join covers both cases.
  // is_owner / member_status let the frontend show an "accept invite"
  // prompt for trips someone else invited them to but they haven't
  // accepted yet.
  async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT t.*, tm.status AS member_status, (t.user_id = ?) AS is_owner
       FROM trips t
       JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = ?
       ORDER BY t.start_date DESC`,
      [userId, userId]
    );
    return Promise.all(rows.map(withFreshStatus));
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM trips WHERE id = ?', [id]);
    return withFreshStatus(rows[0]);
  },

  // The trip currently "in progress" for a user (today falls within its
  // date range), used by the Tracking page. Falls back to the most
  // recently created planned trip so the page still has something useful
  // to show before departure.
  async findActiveForUser(userId) {
    const trips = await this.findByUser(userId);
    return (
      trips.find((t) => t.status === 'ongoing') ||
      trips.find((t) => t.status === 'planned') ||
      trips[0] ||
      null
    );
  },

  async update(id, fields) {
    const allowed = ['title', 'destination', 'dest_lat', 'dest_lng', 'start_date', 'end_date', 'status', 'budget'];
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
    await pool.query(`UPDATE trips SET ${sets.join(', ')} WHERE id = ?`, values);
  },

  async remove(id) {
    await pool.query('DELETE FROM trips WHERE id = ?', [id]);
  },

  async getAll() {
    const [rows] = await pool.query(
      `SELECT t.*, u.name AS user_name FROM trips t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    return rows;
  },

  async countAll() {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM trips');
    return rows[0].total;
  },
};

module.exports = TripModel;
