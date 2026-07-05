const express = require('express');
const router = express.Router();
const {
  getMyJournals, getHighlights, getByTrip, createJournal, deleteJournal,
} = require('../controllers/journalController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getMyJournals);
router.get('/highlights', getHighlights);
router.get('/trip/:tripId', getByTrip);
router.post('/', createJournal);
router.delete('/:id', deleteJournal);

module.exports = router;
