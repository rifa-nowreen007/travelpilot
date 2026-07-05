const { pool } = require('../config/db');
const TripModel = require('../models/tripModel');
const { geocodeDestination } = require('../utils/geocode');

// GET /api/trips  - all trips belonging to the logged in user
exports.getMyTrips = async (req, res) => {
  try {
    const trips = await TripModel.findByUser(req.user.id);
    res.json({ success: true, trips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch trips' });
  }
};

// GET /api/trips/active  - the trip that's currently relevant to track
// (ongoing today, or the nearest upcoming planned trip). Used by the Live
// Tracking page instead of hardcoded demo data.
exports.getActiveTrip = async (req, res) => {
  try {
    const trip = await TripModel.findActiveForUser(req.user.id);
    if (!trip) return res.json({ success: true, trip: null });
    const [points] = await pool.query(
      'SELECT * FROM trip_route_points WHERE trip_id = ? ORDER BY recorded_at ASC',
      [trip.id]
    );
    res.json({ success: true, trip, points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch active trip' });
  }
};

// GET /api/trips/:id
exports.getTripById = async (req, res) => {
  try {
    const trip = await TripModel.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this trip' });
    }
    res.json({ success: true, trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch trip' });
  }
};

// POST /api/trips
// Geocodes the typed destination server-side (free, via OpenStreetMap
// Nominatim — same provider the map tiles already use) so every new trip
// has real coordinates to plot immediately, instead of only the one
// hand-seeded demo trip ever showing up on the map.
exports.createTrip = async (req, res) => {
  try {
    const { title, destination, startDate, endDate, budget, autoTracked } = req.body;
    if (!title || !destination || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'title, destination, startDate and endDate are required' });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
    }

    const geo = await geocodeDestination(destination);

    const tripId = await TripModel.create({
      userId: req.user.id,
      title,
      destination,
      destLat: geo?.lat,
      destLng: geo?.lng,
      startDate,
      endDate,
      budget,
      autoTracked,
    });

    // Seed the route with a single "destination" point so the map has
    // something real to show right away. Once the trip is underway, real
    // GPS pings from POST /api/trips/:id/location (see tripMemberController)
    // append more points and the polyline fills in automatically.
    if (geo) {
      await pool.query(
        `INSERT INTO trip_route_points (trip_id, latitude, longitude, label) VALUES (?, ?, ?, ?)`,
        [tripId, geo.lat, geo.lng, destination.split(',')[0].trim()]
      );
    }

    // The trip owner is automatically a trip_member so they show up
    // consistently in Group Trip / location-sharing logic.
    await pool.query(
      `INSERT INTO trip_members (trip_id, user_id, role, status) VALUES (?, ?, 'owner', 'joined')
       ON DUPLICATE KEY UPDATE role = 'owner'`,
      [tripId, req.user.id]
    );

    const trip = await TripModel.findById(tripId);
    res.status(201).json({
      success: true,
      message: geo ? 'Trip created successfully' : 'Trip created — could not locate that destination on the map, you can retry updating it later',
      trip,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create trip' });
  }
};

// PUT /api/trips/:id
exports.updateTrip = async (req, res) => {
  try {
    const trip = await TripModel.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this trip' });
    }

    const fields = { ...req.body };
    // Re-geocode if the destination text changed.
    if (fields.destination && fields.destination !== trip.destination) {
      const geo = await geocodeDestination(fields.destination);
      if (geo) {
        fields.dest_lat = geo.lat;
        fields.dest_lng = geo.lng;
        await pool.query(
          `INSERT INTO trip_route_points (trip_id, latitude, longitude, label) VALUES (?, ?, ?, ?)`,
          [trip.id, geo.lat, geo.lng, fields.destination.split(',')[0].trim()]
        );
      }
    }
    if (fields.startDate) { fields.start_date = fields.startDate; delete fields.startDate; }
    if (fields.endDate) { fields.end_date = fields.endDate; delete fields.endDate; }

    await TripModel.update(req.params.id, fields);
    const updated = await TripModel.findById(req.params.id);
    res.json({ success: true, message: 'Trip updated successfully', trip: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update trip' });
  }
};

// DELETE /api/trips/:id
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await TripModel.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this trip' });
    }
    await TripModel.remove(req.params.id);
    res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete trip' });
  }
};

// GET /api/trips/predict-cost?destination=Goa&days=5
// Estimates a budget from real historical spending on past trips to the
// same (or a similarly-named) destination. Falls back to a global average
// across all trips with recorded expenses if nobody has been there yet,
// so the estimate is never empty — just lower-confidence.
exports.predictCost = async (req, res) => {
  try {
    const { destination, days } = req.query;
    const numDays = Math.max(1, parseInt(days, 10) || 1);
    if (!destination) {
      return res.status(400).json({ success: false, message: 'destination is required' });
    }

    // Trips to a matching destination that actually have expenses logged.
    const [matches] = await pool.query(
      `SELECT t.id, t.start_date, t.end_date, COALESCE(SUM(e.amount), 0) AS total_spent
       FROM trips t
       LEFT JOIN expenses e ON e.trip_id = t.id
       WHERE t.destination LIKE ?
       GROUP BY t.id
       HAVING total_spent > 0`,
      [`%${destination.split(',')[0].trim()}%`]
    );

    // Duration in days for a trip's date range, clamped to a realistic
    // window (1-60 days). Without this clamp, a single trip with a typo'd
    // or placeholder date range (e.g. months apart) can silently drag the
    // average per-day rate down to near-zero and make every prediction
    // afterwards look broken (e.g. "₹1/day").
    const tripDaysOf = (t) => {
      const raw = Math.round((new Date(t.end_date) - new Date(t.start_date)) / 86400000) + 1;
      return Math.min(60, Math.max(1, raw));
    };
    // A sane per-day floor — real trip spending is never a few rupees a
    // day, so any computed rate below this is treated as bad/incomplete
    // data rather than a genuine budget signal.
    const MIN_PER_DAY = 300;
    const DEFAULT_PER_DAY = 2500;

    // Weighted average (total spent / total days) instead of a plain mean
    // of each trip's rate — this way a single short trip with an
    // unusually low or high rate can't dominate the estimate the way an
    // unweighted average would.
    const weightedPerDay = (rows) => {
      let totalSpent = 0;
      let totalDays = 0;
      for (const t of rows) {
        totalSpent += Number(t.total_spent);
        totalDays += tripDaysOf(t);
      }
      return totalDays ? totalSpent / totalDays : 0;
    };

    let perDay, confidence, basedOn;
    if (matches.length) {
      perDay = weightedPerDay(matches);
      confidence = matches.length >= 3 ? 'high' : 'medium';
      basedOn = matches.length;
    } else {
      // Global fallback: average per-day spend across every trip on the
      // platform that has expenses, regardless of destination.
      const [globalRows] = await pool.query(
        `SELECT t.id, t.start_date, t.end_date, COALESCE(SUM(e.amount), 0) AS total_spent
         FROM trips t LEFT JOIN expenses e ON e.trip_id = t.id
         GROUP BY t.id HAVING total_spent > 0`
      );
      perDay = globalRows.length ? weightedPerDay(globalRows) : 0;
      confidence = globalRows.length ? 'low' : 'none';
      basedOn = 0;
    }

    // Guard against a near-zero rate slipping through from bad/sparse data.
    if (!perDay || perDay < MIN_PER_DAY) {
      perDay = DEFAULT_PER_DAY;
      confidence = 'none';
      basedOn = 0;
    }

    // Category split: use global category proportions as a suggested
    // breakdown of the predicted total (food/stay/transport/etc.).
    const [categoryRows] = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0) AS total FROM expenses GROUP BY category`
    );
    const categoryTotal = categoryRows.reduce((sum, c) => sum + Number(c.total), 0) || 1;
    const predictedTotal = Math.round(perDay * numDays);
    const breakdown = categoryRows.map((c) => ({
      category: c.category,
      amount: Math.round((Number(c.total) / categoryTotal) * predictedTotal),
    }));

    res.json({
      success: true,
      prediction: {
        destination,
        days: numDays,
        perDayEstimate: Math.round(perDay),
        predictedTotal,
        confidence,
        basedOnTrips: basedOn,
        breakdown,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to predict trip cost' });
  }
};

// POST /api/trips/:id/location  - self-reported live GPS ping, used to
// build up the real route polyline + timeline while a trip is ongoing.
exports.pingLocation = async (req, res) => {
  try {
    const { lat, lng, label } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }
    const trip = await TripModel.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the trip owner can report their own location' });
    }

    await pool.query(
      `INSERT INTO trip_route_points (trip_id, latitude, longitude, label) VALUES (?, ?, ?, ?)`,
      [trip.id, lat, lng, label || null]
    );
    // Keep this member's row in trip_members (used by Group Trip sharing)
    // in sync with the same ping.
    await pool.query(
      `UPDATE trip_members SET last_lat = ?, last_lng = ?, last_seen_at = NOW()
       WHERE trip_id = ? AND user_id = ?`,
      [lat, lng, trip.id, req.user.id]
    );

    res.json({ success: true, message: 'Location recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to record location' });
  }
};
