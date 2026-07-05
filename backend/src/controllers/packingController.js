const PackingModel = require('../models/packingModel');
const TripModel = require('../models/tripModel');

// Shared guard: only the trip owner (or an admin) can see/edit its packing
// list, same pattern used for expenses and itineraries.
async function assertTripAccess(tripId, user) {
  const trip = await TripModel.findById(tripId);
  if (!trip) return { error: 404, message: 'Trip not found' };
  if (trip.user_id !== user.id && user.role !== 'admin') {
    return { error: 403, message: 'Not authorized for this trip' };
  }
  return { trip };
}

// GET /api/packing/templates
exports.getTemplates = (req, res) => {
  res.json({ success: true, templates: PackingModel.getTemplateNames() });
};

// GET /api/packing/trip/:tripId
exports.getPackingList = async (req, res) => {
  try {
    const access = await assertTripAccess(req.params.tripId, req.user);
    if (access.error) return res.status(access.error).json({ success: false, message: access.message });

    const items = await PackingModel.findByTrip(req.params.tripId);
    const packedCount = items.filter((i) => i.is_packed).length;
    res.json({
      success: true,
      items,
      progress: items.length ? Math.round((packedCount / items.length) * 100) : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch packing list' });
  }
};

// POST /api/packing
exports.addItem = async (req, res) => {
  try {
    const { tripId, itemName, category, quantity } = req.body;
    if (!tripId || !itemName) {
      return res.status(400).json({ success: false, message: 'tripId and itemName are required' });
    }
    const access = await assertTripAccess(tripId, req.user);
    if (access.error) return res.status(access.error).json({ success: false, message: access.message });

    const id = await PackingModel.create({ tripId, userId: req.user.id, itemName, category, quantity });
    const item = await PackingModel.findById(id);
    res.status(201).json({ success: true, message: 'Item added', item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
};

// POST /api/packing/template
exports.applyTemplate = async (req, res) => {
  try {
    const { tripId, templateName } = req.body;
    if (!tripId || !templateName) {
      return res.status(400).json({ success: false, message: 'tripId and templateName are required' });
    }
    const access = await assertTripAccess(tripId, req.user);
    if (access.error) return res.status(access.error).json({ success: false, message: access.message });

    const count = await PackingModel.applyTemplate({ tripId, userId: req.user.id, templateName });
    if (!count) return res.status(400).json({ success: false, message: 'Unknown template' });

    const items = await PackingModel.findByTrip(tripId);
    res.json({ success: true, message: `Added ${count} items from the ${templateName} template`, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to apply template' });
  }
};

// PATCH /api/packing/:id/toggle
exports.toggleItem = async (req, res) => {
  try {
    const item = await PackingModel.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    const access = await assertTripAccess(item.trip_id, req.user);
    if (access.error) return res.status(access.error).json({ success: false, message: access.message });

    await PackingModel.togglePacked(req.params.id);
    const updated = await PackingModel.findById(req.params.id);
    res.json({ success: true, item: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

// PUT /api/packing/:id
exports.updateItem = async (req, res) => {
  try {
    const item = await PackingModel.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    const access = await assertTripAccess(item.trip_id, req.user);
    if (access.error) return res.status(access.error).json({ success: false, message: access.message });

    await PackingModel.update(req.params.id, req.body);
    const updated = await PackingModel.findById(req.params.id);
    res.json({ success: true, item: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

// DELETE /api/packing/:id
exports.deleteItem = async (req, res) => {
  try {
    const item = await PackingModel.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    const access = await assertTripAccess(item.trip_id, req.user);
    if (access.error) return res.status(access.error).json({ success: false, message: access.message });

    await PackingModel.remove(req.params.id);
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};
