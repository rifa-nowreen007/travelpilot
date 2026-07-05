const { pool } = require('../config/db');

// Starter templates so a user gets a useful list instantly instead of a
// blank page. Keyed by trip "vibe" — matched loosely against destination/
// trip type on the frontend, but the backend just needs the name to look
// up the right array.
const TEMPLATES = {
  general: [
    ['Phone charger', 'electronics'], ['Power bank', 'electronics'],
    ['ID / Aadhaar card', 'documents'], ['Tickets & booking printouts', 'documents'],
    ['Toothbrush & toothpaste', 'toiletries'], ['Basic medicine kit', 'health'],
    ['Reusable water bottle', 'misc'], ['Comfortable footwear', 'clothing'],
  ],
  beach: [
    ['Swimwear', 'clothing'], ['Sunscreen (SPF 50+)', 'toiletries'],
    ['Sunglasses', 'misc'], ['Flip-flops', 'clothing'],
    ['Beach towel', 'misc'], ['Waterproof phone pouch', 'electronics'],
    ['After-sun lotion', 'toiletries'],
  ],
  trekking: [
    ['Trekking shoes', 'clothing'], ['Rain jacket', 'clothing'],
    ['Headlamp / torch', 'electronics'], ['First-aid kit', 'health'],
    ['Energy bars & snacks', 'misc'], ['Thermal wear', 'clothing'],
    ['Trekking pole', 'misc'], ['Water purification tablets', 'health'],
  ],
  business: [
    ['Formal outfits', 'clothing'], ['Laptop & charger', 'electronics'],
    ['Business cards', 'documents'], ['Ironed shirts', 'clothing'],
    ['Notebook & pen', 'misc'], ['Portable adapter', 'electronics'],
  ],
  winter: [
    ['Heavy jacket', 'clothing'], ['Thermal inner wear', 'clothing'],
    ['Gloves & beanie', 'clothing'], ['Moisturizer / lip balm', 'toiletries'],
    ['Woolen socks', 'clothing'], ['Hand warmers', 'misc'],
  ],
};

const PackingModel = {
  getTemplateNames() {
    return Object.keys(TEMPLATES);
  },

  async findByTrip(tripId) {
    const [rows] = await pool.query(
      'SELECT * FROM packing_items WHERE trip_id = ? ORDER BY category, id ASC',
      [tripId]
    );
    return rows;
  },

  async create({ tripId, userId, itemName, category, quantity }) {
    const [result] = await pool.query(
      `INSERT INTO packing_items (trip_id, user_id, item_name, category, quantity)
       VALUES (?, ?, ?, ?, ?)`,
      [tripId, userId, itemName, category || 'misc', quantity || 1]
    );
    return result.insertId;
  },

  // Inserts every item of a named template in one go (used by the "Apply
  // template" buttons on the Packing Checklist page).
  async applyTemplate({ tripId, userId, templateName }) {
    const items = TEMPLATES[templateName];
    if (!items) return 0;
    const values = items.map(([name, category]) => [tripId, userId, name, category, 1]);
    await pool.query(
      `INSERT INTO packing_items (trip_id, user_id, item_name, category, quantity) VALUES ?`,
      [values]
    );
    return items.length;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM packing_items WHERE id = ?', [id]);
    return rows[0];
  },

  async togglePacked(id) {
    await pool.query('UPDATE packing_items SET is_packed = NOT is_packed WHERE id = ?', [id]);
  },

  async update(id, fields) {
    const allowed = ['item_name', 'category', 'quantity', 'is_packed'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (!sets.length) return;
    values.push(id);
    await pool.query(`UPDATE packing_items SET ${sets.join(', ')} WHERE id = ?`, values);
  },

  async remove(id) {
    await pool.query('DELETE FROM packing_items WHERE id = ?', [id]);
  },
};

module.exports = PackingModel;
