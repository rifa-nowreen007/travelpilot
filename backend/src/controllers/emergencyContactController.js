const EmergencyContactModel = require('../models/emergencyContactModel');

// GET /api/emergency-contacts
exports.getContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContactModel.findByUser(req.user.id);
    res.json({ success: true, contacts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch emergency contacts' });
  }
};

// POST /api/emergency-contacts
exports.addContact = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'name and phone are required' });
    }
    // Basic E.164-ish sanity check — keeps garbage numbers from silently
    // failing at Twilio later without any feedback to the user.
    if (!/^\+?[0-9\s-]{7,20}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid phone number, include the country code e.g. +91' });
    }
    const id = await EmergencyContactModel.create({ userId: req.user.id, name, phone });
    const contact = await EmergencyContactModel.findById(id);
    res.status(201).json({ success: true, contact });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add emergency contact' });
  }
};

// DELETE /api/emergency-contacts/:id
exports.deleteContact = async (req, res) => {
  try {
    const contact = await EmergencyContactModel.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    if (contact.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await EmergencyContactModel.remove(req.params.id);
    res.json({ success: true, message: 'Contact removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
};
