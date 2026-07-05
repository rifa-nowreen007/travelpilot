// Client-side mirror of the backend's rule-based assistant so the chat works
// instantly in demo mode without a live API connection.
export function generateDemoReply(message) {
  const m = message.toLowerCase();

  if (/(pack|luggage|carry|bring)/.test(m)) {
    return "For most Indian trips: breathable cottons, a rain layer between June–September, a power bank, and copies of your ID. Tell me your destination and I'll tailor the list further.";
  }
  if (/(budget|cost|expense|cheap|money)/.test(m)) {
    return 'A comfortable mid-range trip in India usually runs ₹2,000–3,500/day per person including stay, food and local transport. Want a breakdown for a specific destination?';
  }
  if (/(safe|safety|sos|emergency)/.test(m)) {
    return "Safety first — keep the SOS button one tap away, share your live trip with a trusted contact, and avoid isolated trails after dark. TravelPilot auto-alerts your emergency contact if you're inactive too long on a tracked route.";
  }
  if (/(eco|sustainab|green|carbon)/.test(m)) {
    return 'Trains and buses score far higher on Eco Score than flights or private cars — swapping a short flight for a train can cut trip emissions by up to 80%.';
  }
  if (/(itinerary|plan|schedule|days)/.test(m)) {
    return 'I can sketch a day-by-day plan — tell me the destination, number of days, and whether you prefer adventure, relaxation, or culture-focused stops.';
  }
  if (/(weather|climate|rain|season)/.test(m)) {
    return 'Hill destinations like Manali and Rishikesh are pleasant March–June and September–November, and best avoided during peak monsoon landslides (July–August).';
  }
  if (/(hi|hello|hey)/.test(m)) {
    return "Hey traveller! I'm your TravelPilot AI Assistant — ask me about itineraries, packing, budgets, safety, or local recommendations.";
  }
  if (/(eco score|score)/.test(m)) {
    return 'Your Eco Score blends transport mode, distance, and trip duration into a 0–100 rating — higher means a lighter carbon footprint. Trains and buses boost it the most.';
  }
  return "Got it — noted. I can help with itinerary planning, packing lists, budgeting, safety tips, and eco-friendly travel options. What would you like to dig into?";
}

export const SUGGESTED_PROMPTS = [
  'What should I pack for Manali in August?',
  'Suggest a 3-day Rishikesh itinerary',
  'How can I keep my trip eco-friendly?',
  'Is solo travel in Kerala safe?',
];
