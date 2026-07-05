const express = require('express');
const router = express.Router();
const { getHistory } = require('../controllers/groupChatController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:tripId', getHistory);

module.exports = router;
