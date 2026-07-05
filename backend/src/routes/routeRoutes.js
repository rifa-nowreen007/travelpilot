const express = require('express');
const router = express.Router();
const { getTripRoute } = require('../controllers/routeController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:tripId', getTripRoute);

module.exports = router;
