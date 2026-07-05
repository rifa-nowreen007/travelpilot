const express = require('express');
const router = express.Router();
const { getHistory, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/history', getHistory);
router.post('/message', sendMessage);

module.exports = router;
