const { pool } = require('../config/db');

// GET /api/routes/:tripId  - ordered route points for the Live Trip Demo map
exports.getTripRoute = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM trip_route_points WHERE trip_id = ? ORDER BY recorded_at ASC',
      [req.params.tripId]
    );
    res.json({ success: true, points: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch route points' });
  }
};
