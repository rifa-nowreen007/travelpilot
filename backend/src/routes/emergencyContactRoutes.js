const express = require('express');
const router = express.Router();
const { getContacts, addContact, deleteContact } = require('../controllers/emergencyContactController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getContacts);
router.post('/', addContact);
router.delete('/:id', deleteContact);

module.exports = router;
