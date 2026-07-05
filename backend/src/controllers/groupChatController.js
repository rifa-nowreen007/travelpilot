const GroupMessageModel = require('../models/groupMessageModel');
const TripMemberModel = require('../models/tripMemberModel');

// GET /api/group-chat/:tripId
// Chat history for a trip — only visible to that trip's members, so one
// group's conversation never leaks into another trip's chat.
exports.getHistory = async (req, res) => {
  try {
    const { tripId } = req.params;
    const member = await TripMemberModel.findByTripAndUser(tripId, req.user.id);
    if (!member || member.status !== 'joined') {
      return res.status(403).json({ success: false, message: 'You are not a member of this trip yet — accept the invite first' });
    }
    const messages = await GroupMessageModel.findByTrip(tripId);
    res.json({ success: true, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
};
