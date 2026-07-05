const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, toggleUserStatus, deleteUser,
  getAllTrips, getAllFeedback, getAllSos, getReports, getSettings, updateSetting,
} = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect, requireRole('admin')); // every admin route requires an authenticated admin

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/trips', getAllTrips);
router.get('/feedback', getAllFeedback);
router.get('/sos', getAllSos);
router.get('/reports', getReports);
router.get('/settings', getSettings);
router.put('/settings/:key', updateSetting);

module.exports = router;
