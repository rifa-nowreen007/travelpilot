const { pool } = require('../config/db');

// GET /api/activity  - unified recent activity feed for the logged in user
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    const [trips] = await pool.query(
      `SELECT id, title AS label, 'trip' AS type, status AS meta, created_at
       FROM trips WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    const [expenses] = await pool.query(
      `SELECT id, description AS label, 'expense' AS type, CONCAT('₹', amount) AS meta, created_at
       FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    const [journals] = await pool.query(
      `SELECT id, title AS label, 'journal' AS type, mood AS meta, created_at
       FROM journals WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    const [sos] = await pool.query(
      `SELECT id, message AS label, 'sos' AS type, status AS meta, created_at
       FROM sos_alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 3`,
      [userId]
    );

    const feed = [...trips, ...expenses, ...journals, ...sos]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 12);

    res.json({ success: true, activity: feed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch recent activity' });
  }
};
