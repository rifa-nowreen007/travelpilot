const express = require('express');
const router = express.Router();
const {
  register, login, googleAuth, forgotPassword, resetPassword, getProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getProfile);

module.exports = router;
