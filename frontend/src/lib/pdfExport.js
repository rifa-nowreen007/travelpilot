// Client-side PDF generation with jsPDF — no backend involved, no API key,
// works entirely in the browser. Keeps layout deliberately simple (manual
// text placement) rather than pulling in jspdf-autotable as an extra
// dependency for what are fairly small documents.
import { jsPDF } from 'jspdf';

const MARGIN = 15;
const LINE_H = 7;

function newDoc(title) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(13, 148, 136); // teal-600, matches brand color
  doc.text('TravelPilot', MARGIN, 18);
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(title, MARGIN, 27);
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, 31, 195, 31);
  return { doc, y: 40 };
}

function ensureSpace(doc, y, needed = LINE_H) {
  if (y + needed > 285) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function exportItineraryPDF({ tripTitle, destination, plan }) {
  const { doc, y: startY } = newDoc(`Itinerary — ${tripTitle || destination || 'Trip'}`);
  let y = startY;

  const days = Object.keys(plan).map(Number).sort((a, b) => a - b);
  if (!days.length) {
    doc.setFontSize(11);
    doc.text('No itinerary items yet.', MARGIN, y);
  }

  days.forEach((day) => {
    y = ensureSpace(doc, y, LINE_H + 4);
    doc.setFontSize(13);
    doc.setTextColor(13, 148, 136);
    doc.text(`Day ${day}`, MARGIN, y);
    y += LINE_H;

    const stops = plan[day] || [];
    if (!stops.length) {
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text('No stops planned.', MARGIN + 4, y);
      y += LINE_H;
    }

    stops.forEach((s) => {
      y = ensureSpace(doc, y, LINE_H * 2);
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(`${s.time}  —  ${s.place}`, MARGIN + 4, y);
      y += 5;
      doc.setTextColor(90, 90, 90);
      doc.text(`${s.activity}  [${s.tier}${s.eco ? ', eco-friendly' : ''}]`, MARGIN + 4, y);
      y += LINE_H;
    });
    y += 3;
  });

  doc.save(`${(tripTitle || 'itinerary').replace(/\s+/g, '_')}_itinerary.pdf`);
}

export function exportPackingListPDF({ tripTitle, items }) {
  const { doc, y: startY } = newDoc(`Packing Checklist — ${tripTitle || 'Trip'}`);
  let y = startY;

  const byCategory = {};
  items.forEach((item) => {
    const cat = item.category || 'misc';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });

  Object.entries(byCategory).forEach(([category, catItems]) => {
    y = ensureSpace(doc, y, LINE_H + 4);
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text(category.charAt(0).toUpperCase() + category.slice(1), MARGIN, y);
    y += LINE_H;

    catItems.forEach((item) => {
      y = ensureSpace(doc, y);
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      const box = item.is_packed ? '[x]' : '[ ]';
      const qty = item.quantity > 1 ? ` x${item.quantity}` : '';
      doc.text(`${box} ${item.item_name}${qty}`, MARGIN + 4, y);
      y += LINE_H;
    });
    y += 2;
  });

  doc.save(`${(tripTitle || 'packing').replace(/\s+/g, '_')}_packing_list.pdf`);
}

export function exportTripsSummaryPDF(trips) {
  const { doc, y: startY } = newDoc('My Trips — Summary');
  let y = startY;

  trips.forEach((trip) => {
    y = ensureSpace(doc, y, LINE_H * 3);
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(trip.title, MARGIN, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(`${trip.destination}  |  ${trip.start_date} to ${trip.end_date}  |  ${trip.status}`, MARGIN, y);
    y += 5;
    doc.text(`Budget: Rs. ${Number(trip.budget || 0).toLocaleString('en-IN')}`, MARGIN, y);
    y += LINE_H + 3;
    doc.setDrawColor(235, 235, 235);
    doc.line(MARGIN, y - 5, 195, y - 5);
  });

  doc.save('travelpilot_trips_summary.pdf');
}
