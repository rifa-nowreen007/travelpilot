const { getWeather } = require('../utils/weather');

// GET /api/weather?destination=Manali  (or ?lat=..&lng=..)
exports.getForDestination = async (req, res) => {
  try {
    const { destination, lat, lng } = req.query;
    if (!destination && (lat === undefined || lng === undefined)) {
      return res.status(400).json({ success: false, message: 'destination or lat/lng is required' });
    }

    const weather = await getWeather({
      destination,
      lat: lat !== undefined ? parseFloat(lat) : undefined,
      lng: lng !== undefined ? parseFloat(lng) : undefined,
    });

    if (!weather) {
      return res.status(404).json({ success: false, message: 'Could not find weather for that location' });
    }
    res.json({ success: true, weather });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch weather' });
  }
};
