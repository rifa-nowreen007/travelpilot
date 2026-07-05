// Builds a real UPI payment-request deep link. Any UPI app (GPay, PhonePe,
// Paytm, BHIM, etc.) recognizes this URI scheme and opens pre-filled with
// the recipient, amount, and a note — no API, no signup, completely free.
//
// Note: this can *request* a payment but can't automatically confirm one
// was received — that requires a licensed payment aggregator (Razorpay,
// Cashfree, etc.) with business KYC, which is out of scope here.

export function buildUpiLink({ payeeVpa, payeeName, amount, note }) {
  if (!payeeVpa) return null;
  const params = new URLSearchParams({
    pa: payeeVpa,
    pn: payeeName || 'TravelPilot',
    am: Number(amount).toFixed(2),
    cu: 'INR',
  });
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
}
