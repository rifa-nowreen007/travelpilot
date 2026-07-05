const UserModel = require('../models/userModel');
const TripModel = require('../models/tripModel');
const { pool } = require('../config/db');

// GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await UserModel.countAll();
    const totalTrips = await TripModel.countAll();

    const [[{ totalExpenses }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS totalExpenses FROM expenses'
    );
    const [[{ activeSos }]] = await pool.query(
      "SELECT COUNT(*) AS activeSos FROM sos_alerts WHERE status = 'active'"
    );
    const [[{ newFeedback }]] = await pool.query(
      "SELECT COUNT(*) AS newFeedback FROM feedback WHERE status = 'new'"
    );

    res.json({
      success: true,
      stats: { totalUsers, totalTrips, totalExpenses, activeSos, newFeedback },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.getAll();
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// PATCH /api/admin/users/:id/status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    await UserModel.setActive(req.params.id, !!isActive);
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    await UserModel.remove(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// GET /api/admin/trips
exports.getAllTrips = async (req, res) => {
  try {
    const trips = await TripModel.getAll();
    res.json({ success: true, trips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch trips' });
  }
};

// GET /api/admin/feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM feedback ORDER BY created_at DESC');
    res.json({ success: true, feedback: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
  }
};

// GET /api/admin/sos
exports.getAllSos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.name AS user_name, u.phone AS user_phone FROM sos_alerts s
       JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC`
    );
    res.json({ success: true, alerts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch SOS alerts' });
  }
};

// GET /api/admin/reports  - aggregated analytics for the Reports & Analytics tab
exports.getReports = async (req, res) => {
  try {
    const [expenseByCategory] = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM expenses GROUP BY category ORDER BY total DESC`
    );
    const [tripsByStatus] = await pool.query(
      `SELECT status, COUNT(*) AS total FROM trips GROUP BY status`
    );
    const [tripsByMonth] = await pool.query(
      `SELECT DATE_FORMAT(start_date, '%Y-%m') AS month, COUNT(*) AS total
       FROM trips GROUP BY month ORDER BY month ASC`
    );
    const [ecoAverage] = await pool.query(
      `SELECT ROUND(AVG(eco_score), 1) AS avgEcoScore FROM trips WHERE eco_score > 0`
    );
    const [topDestinations] = await pool.query(
      `SELECT destination, COUNT(*) AS total FROM trips GROUP BY destination ORDER BY total DESC LIMIT 5`
    );

    res.json({
      success: true,
      reports: {
        expenseByCategory,
        tripsByStatus,
        tripsByMonth,
        avgEcoScore: ecoAverage[0]?.avgEcoScore || 0,
        topDestinations,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};

// GET /api/admin/settings
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM system_settings');
    res.json({ success: true, settings: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

// PUT /api/admin/settings/:key
exports.updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    await pool.query(
      'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
      [value, req.params.key]
    );
    res.json({ success: true, message: 'Setting updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update setting' });
  }
};
