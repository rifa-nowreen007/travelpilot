const express = require('express');
const router = express.Router();
const {
  getExpensesByTrip, getMyExpenses, createExpense, updateExpense, deleteExpense, scanReceiptImage,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/mine', getMyExpenses);
router.get('/trip/:tripId', getExpensesByTrip);
router.post('/scan-receipt', scanReceiptImage);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
