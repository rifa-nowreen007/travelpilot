const ExpenseModel = require('../models/expenseModel');
const TripModel = require('../models/tripModel');
const TripMemberModel = require('../models/tripMemberModel');
const { scanReceipt } = require('../utils/groqVision');

// GET /api/expenses/mine  - recent expenses across all of the logged-in
// user's own trips (used by the Dashboard's Recent Expenses widget).
exports.getMyExpenses = async (req, res) => {
  try {
    const expenses = await ExpenseModel.findByUser(req.user.id);
    res.json({ success: true, expenses: expenses.slice(0, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

async function isTripMember(tripId, userId) {
  const trip = await TripModel.findById(tripId);
  if (!trip) return { trip: null };
  if (trip.user_id === userId) return { trip, member: null, isOwner: true };
  const member = await TripMemberModel.findByTripAndUser(tripId, userId);
  if (!member || member.status !== 'joined') return { trip, member: null, isOwner: false, notAMember: true };
  return { trip, member, isOwner: false };
}

// GET /api/expenses/trip/:tripId
// Any joined member can view — used by both the personal Live Tracking
// expense log and the shared Group Trip splitter.
exports.getExpensesByTrip = async (req, res) => {
  try {
    const { trip, notAMember } = await isTripMember(req.params.tripId, req.user.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (notAMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const expenses = await ExpenseModel.findByTrip(req.params.tripId);
    const total = await ExpenseModel.totalByTrip(req.params.tripId);
    const breakdown = await ExpenseModel.categoryBreakdown(req.params.tripId);

    // Real equal-split balances: how much each trip member has paid vs.
    // their equal share of the trip total.
    const members = await TripMemberModel.findByTrip(req.params.tripId);
    const joined = members.filter((m) => m.status === 'joined');
    const memberTotals = await ExpenseModel.totalsByMember(req.params.tripId);
    const totalsByMemberId = Object.fromEntries(memberTotals.map((r) => [r.paid_by_member_id, Number(r.total)]));
    const perHead = joined.length ? Number(total) / joined.length : 0;
    const balances = joined.map((m) => {
      const paid = totalsByMemberId[m.id] || 0;
      return {
        memberId: m.id,
        name: m.user_name || m.invite_name,
        paid,
        balance: Math.round((paid - perHead) * 100) / 100,
        upiId: m.upi_id || null,
      };
    });

    res.json({ success: true, expenses, total, breakdown, balances, perHead: Math.round(perHead * 100) / 100 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

// POST /api/expenses
// Any joined trip member can log an expense (not just the trip owner),
// attributed to whichever member actually paid via paidByMemberId.
exports.createExpense = async (req, res) => {
  try {
    const { tripId, category, amount, description, expenseDate, isOcrScanned, receiptImage, paidByMemberId } = req.body;
    if (!tripId || !amount || !expenseDate) {
      return res.status(400).json({ success: false, message: 'tripId, amount and expenseDate are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    const { trip, notAMember } = await isTripMember(tripId, req.user.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (notAMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to add expenses to this trip' });
    }

    const id = await ExpenseModel.create({
      tripId,
      userId: req.user.id,
      paidByMemberId: paidByMemberId || null,
      category,
      amount,
      description,
      expenseDate,
      isOcrScanned,
      receiptImage,
    });
    const expense = await ExpenseModel.findById(id);
    res.status(201).json({ success: true, message: 'Expense added successfully', expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create expense' });
  }
};

// POST /api/expenses/scan-receipt  { imageBase64: "data:image/jpeg;base64,..." }
// Uses Groq's vision model (same GROQ_API_KEY as the AI Assistant, no new
// signup) to read a photographed receipt and pre-fill the expense form.
// Does not write to the database — just returns parsed fields.
exports.scanReceiptImage = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'imageBase64 is required' });
    }
    const result = await scanReceipt(imageBase64);
    if (!result.ok) {
      const message =
        result.error === 'groq_not_configured'
          ? 'Receipt scanning needs GROQ_API_KEY set on the server'
          : "Couldn't read that receipt clearly — try a clearer photo, or enter the details manually";
      return res.status(422).json({ success: false, message });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to scan receipt' });
  }
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const expense = await ExpenseModel.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await ExpenseModel.update(req.params.id, req.body);
    const updated = await ExpenseModel.findById(req.params.id);
    res.json({ success: true, message: 'Expense updated successfully', expense: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update expense' });
  }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await ExpenseModel.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await ExpenseModel.remove(req.params.id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
};
