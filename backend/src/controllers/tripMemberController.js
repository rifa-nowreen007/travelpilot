const TripModel = require('../models/tripModel');
const TripMemberModel = require('../models/tripMemberModel');
const { sendMessage, isConfigured } = require('../utils/notify');

async function assertMember(tripId, userId, role) {
  const trip = await TripModel.findById(tripId);
  if (!trip) return { error: 404, message: 'Trip not found' };
  if (trip.user_id === userId) return { trip, isOwner: true };
  const member = await TripMemberModel.findByTripAndUser(tripId, userId);
  if (!member || member.status !== 'joined') return { error: 403, message: 'Not a member of this trip' };
  if (role === 'owner') return { error: 403, message: 'Only the trip owner can do this' };
  return { trip, isOwner: false };
}

// GET /api/trips/:tripId/members
// Privacy rule: a member's live coordinates are only ever included for
// themselves, or for others who have explicitly turned location_shared on.
// Nobody's raw phone number is exposed to other members either.
exports.listMembers = async (req, res) => {
  try {
    const { tripId } = req.params;
    const check = await assertMember(tripId, req.user.id);
    if (check.error) return res.status(check.error).json({ success: false, message: check.message });

    const rows = await TripMemberModel.findByTrip(tripId);
    const members = rows.map((m) => {
      const isSelf = m.user_id === req.user.id;
      const canSeeLocation = isSelf || m.location_shared;
      return {
        id: m.id,
        name: m.user_name || m.invite_name,
        role: m.role,
        status: m.status,
        isSelf,
        locationShared: !!m.location_shared,
        lat: canSeeLocation ? m.last_lat : null,
        lng: canSeeLocation ? m.last_lng : null,
        lastSeenAt: canSeeLocation ? m.last_seen_at : null,
        upiId: m.upi_id || null,
      };
    });
    res.json({ success: true, members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

// POST /api/trips/:tripId/members
// Sends a real SMS/WhatsApp invite via Twilio (falls back to a console log
// + still-created invite record if Twilio isn't configured, so the flow
// never silently breaks in dev).
exports.inviteMember = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'name and phone are required' });
    }
    if (!/^\+?[0-9\s-]{7,20}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid phone number, include the country code e.g. +91' });
    }

    const check = await assertMember(tripId, req.user.id, 'owner');
    if (check.error) return res.status(check.error).json({ success: false, message: check.message });

    const { id, matchedUser } = await TripMemberModel.invite({ tripId, inviteName: name, invitePhone: phone });

    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/group`;
    const body = `${req.user.name} invited you on TravelPilot to join the trip "${check.trip.title}" to ${check.trip.destination}. Open ${link} to accept and (optionally) share your live location with the group.`;
    const delivery = await sendMessage({ to: phone, body, channel: 'whatsapp' });
    const fallback = delivery.ok ? null : await sendMessage({ to: phone, body, channel: 'sms' });

    res.status(201).json({
      success: true,
      message: matchedUser
        ? `Invite sent — ${name} already has a TravelPilot account and can accept from their Group Trip page`
        : `Invite sent to ${phone}`,
      memberId: id,
      twilioConfigured: isConfigured(),
      delivered: delivery.ok || !!fallback?.ok,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to invite member' });
  }
};

// PATCH /api/trips/:tripId/members/me/sharing  { shared: boolean }
// Only a member can turn *their own* location sharing on/off — nobody else
// can flip this for them.
exports.setMySharing = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { shared } = req.body;
    const check = await assertMember(tripId, req.user.id);
    if (check.error) return res.status(check.error).json({ success: false, message: check.message });

    await TripMemberModel.setLocationShared(tripId, req.user.id, shared);
    res.json({ success: true, message: shared ? 'Location sharing turned on' : 'Location sharing turned off' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update sharing preference' });
  }
};

// PATCH /api/trips/:tripId/members/me/upi  { upiId: "name@bank" }
// Only a member can set *their own* UPI ID — used so trip-mates can pay
// them back via a real upi://pay link.
exports.setMyUpi = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { upiId } = req.body;
    if (upiId && !/^[\w.+-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      return res.status(400).json({ success: false, message: 'That doesn\'t look like a valid UPI ID (e.g. name@okhdfcbank)' });
    }
    const check = await assertMember(tripId, req.user.id);
    if (check.error) return res.status(check.error).json({ success: false, message: check.message });

    await TripMemberModel.setUpiId(tripId, req.user.id, upiId);
    res.json({ success: true, message: upiId ? 'UPI ID saved' : 'UPI ID removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update UPI ID' });
  }
};

// PATCH /api/trips/:tripId/members/accept  - the invited user accepting
exports.acceptInvite = async (req, res) => {
  try {
    const { tripId } = req.params;
    const member = await TripMemberModel.findByTripAndUser(tripId, req.user.id);
    if (!member) return res.status(404).json({ success: false, message: 'No invite found for this trip' });
    await TripMemberModel.markStatus(member.id, 'joined');
    res.json({ success: true, message: 'You joined the trip' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to accept invite' });
  }
};

// DELETE /api/trips/:tripId/members/:memberId  - owner removes a member
exports.removeMember = async (req, res) => {
  try {
    const { tripId, memberId } = req.params;
    const check = await assertMember(tripId, req.user.id, 'owner');
    if (check.error) return res.status(check.error).json({ success: false, message: check.message });
    await TripMemberModel.remove(memberId);
    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};
