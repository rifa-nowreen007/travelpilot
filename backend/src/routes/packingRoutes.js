const express = require('express');
const router = express.Router();
const {
  getTemplates, getPackingList, addItem, applyTemplate, toggleItem, updateItem, deleteItem,
} = require('../controllers/packingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/templates', getTemplates);
router.get('/trip/:tripId', getPackingList);
router.post('/', addItem);
router.post('/template', applyTemplate);
router.patch('/:id/toggle', toggleItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
