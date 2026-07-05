const JournalModel = require('../models/journalModel');

// Must match the ENUM in database/schema.sql exactly — journals.mood.
const VALID_MOODS = ['excited', 'happy', 'relaxed', 'tired', 'adventurous', 'nostalgic'];

// GET /api/journals  - all journal entries for the logged in user
exports.getMyJournals = async (req, res) => {
  try {
    const journals = await JournalModel.findByUser(req.user.id);
    res.json({ success: true, journals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch journal entries' });
  }
};

// GET /api/journals/highlights  - AI-flagged memory highlights only
exports.getHighlights = async (req, res) => {
  try {
    const highlights = await JournalModel.highlights(req.user.id);
    res.json({ success: true, highlights });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch highlights' });
  }
};

// GET /api/journals/trip/:tripId
exports.getByTrip = async (req, res) => {
  try {
    const journals = await JournalModel.findByTrip(req.params.tripId);
    res.json({ success: true, journals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch trip journal' });
  }
};

// POST /api/journals
exports.createJournal = async (req, res) => {
  try {
    const { tripId, title, content, mood, entryDate, photoUrl } = req.body;
    if (!tripId || !title || !content || !entryDate) {
      return res.status(400).json({ success: false, message: 'tripId, title, content and entryDate are required' });
    }
    if (mood && !VALID_MOODS.includes(mood)) {
      return res.status(400).json({ success: false, message: `mood must be one of: ${VALID_MOODS.join(', ')}` });
    }
    const id = await JournalModel.create({ tripId, userId: req.user.id, title, content, mood, entryDate, photoUrl });
    res.status(201).json({ success: true, message: 'Journal entry saved', journalId: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save journal entry' });
  }
};

// DELETE /api/journals/:id
exports.deleteJournal = async (req, res) => {
  try {
    await JournalModel.remove(req.params.id);
    res.json({ success: true, message: 'Journal entry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete journal entry' });
  }
};
