const { pool } = require('../config/db');
const EmergencyContactModel = require('../models/emergencyContactModel');
const { notifyContacts, isConfigured } = require('../utils/notify');
const { findNearby } = require('../utils/overpass');

// GET /api/safety/nearby?lat=..&lng=..
// Real hospitals/police near any point, via free OpenStreetMap data — used
// for both the user's live GPS position and a trip's destination.
exports.getNearby = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'lat and lng query params are required' });
    }
    const nearby = await findNearby(lat, lng);
    res.json({ success: true, ...nearby });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch nearby hospitals/police' });
  }
};

// POST /api/safety/sos
// Real panic-button endpoint: records the alert, then actually fans it out
// as SMS/WhatsApp to every emergency contact the user has saved. Returns
// per-contact delivery status so the UI can show "Mom notified ✓ / Rahul
// failed" instead of a fake animation.
exports.triggerSos = async (req, res) => {
  try {
    const { lat, lng, tripId, message } = req.body;

    const [result] = await pool.query(
      `INSERT INTO sos_alerts (user_id, trip_id, latitude, longitude, message, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [req.user.id, tripId || null, lat ?? null, lng ?? null, message || null]
    );
    const alertId = result.insertId;

    const contacts = await EmergencyContactModel.findByUser(req.user.id);

    const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : 'location unavailable';
    const body = `TravelPilot SOS: ${req.user.name} has triggered an emergency alert${message ? ` — "${message}"` : ''}. Live location: ${mapsLink}`;

    const deliveries = contacts.length ? await notifyContacts(contacts, body) : [];

    res.status(201).json({
      success: true,
      message: contacts.length
        ? 'SOS triggered — alerting your emergency contacts'
        : 'SOS triggered — add emergency contacts above so they actually get notified next time',
      alertId,
      twilioConfigured: isConfigured(),
      notified: deliveries.map((d) => ({ name: d.name, ok: d.ok, channel: d.channel })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to trigger SOS' });
  }
};

// PATCH /api/safety/sos/:id/resolve
exports.resolveSos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sos_alerts WHERE id = ?', [req.params.id]);
    const alert = rows[0];
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    if (alert.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await pool.query(
      `UPDATE sos_alerts SET status = 'resolved', resolved_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true, message: 'Alert marked as resolved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to resolve alert' });
  }
};

// GET /api/safety/sos/mine  - the logged-in user's own alert history
exports.myAlerts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sos_alerts WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, alerts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
};
