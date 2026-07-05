const express = require('express');
const router = express.Router();
const {
  getMyTrips, getActiveTrip, getTripById, createTrip, updateTrip, deleteTrip, pingLocation, predictCost,
} = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

router.use(protect); // every trip route requires a logged-in user

router.get('/', getMyTrips);
router.post('/', createTrip);
router.get('/active', getActiveTrip); // must come before /:id
router.get('/predict-cost', predictCost); // must come before /:id
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.post('/:id/location', pingLocation);

module.exports = router;
