const express = require('express');
const router = express.Router();
const { triggerSos, resolveSos, myAlerts, getNearby } = require('../controllers/safetyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/nearby', getNearby);
router.post('/sos', triggerSos);
router.patch('/sos/:id/resolve', resolveSos);
router.get('/sos/mine', myAlerts);

module.exports = router;
