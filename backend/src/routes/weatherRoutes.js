const express = require('express');
const router = express.Router();
const { getForDestination } = require('../controllers/weatherController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getForDestination);

module.exports = router;
