-- =========================================================
-- TravelPilot Sample / Seed Data
-- Run AFTER schema.sql
--
-- Local development only. The admin row below is the ONLY account with the
-- 'admin' role — public registration always creates 'tourist' accounts
-- (see backend/src/controllers/authController.js), so this is the sole way
-- to sign in at /admin/login. Change this password before any real deployment.
-- =========================================================

USE travelpilot;

-- ---------------------------------------------------------
-- USERS
-- ---------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, phone, emergency_contact) VALUES
('Nowreen Rifa', 'nowreenrifa@gmail.com', '$2a$10$0mFVmdC7Tu9OOVslLlH3FOL8pHivNEitSXTzI4zBougM2UR7g1Wea', 'admin', '9999999999', '9999999998'),
('Rahul Sharma', 'rahul@travelpilot.com', '$2b$10$hhoeaeET.kdbQkbgVSZkDewmcMgORcjAupDYbtB8Ue6kavQBJfWO.', 'tourist', '9876543210', '9876500000'),
('Ananya Iyer', 'ananya@travelpilot.com', '$2b$10$hhoeaeET.kdbQkbgVSZkDewmcMgORcjAupDYbtB8Ue6kavQBJfWO.', 'tourist', '9876543211', '9876500001'),
('Vikram Singh', 'vikram@travelpilot.com', '$2b$10$hhoeaeET.kdbQkbgVSZkDewmcMgORcjAupDYbtB8Ue6kavQBJfWO.', 'tourist', '9876543212', '9876500002');

-- ---------------------------------------------------------
-- TRIPS
-- ---------------------------------------------------------
INSERT INTO trips (user_id, title, destination, start_date, end_date, status, budget, auto_tracked, distance_km, eco_score, transport_mode) VALUES
(2, 'Himalayan Backpacking', 'Manali, Himachal Pradesh', '2026-08-10', '2026-08-18', 'planned', 25000.00, TRUE, 570.00, 78, 'bus'),
(2, 'Goa Beach Getaway', 'Goa', '2026-03-05', '2026-03-09', 'completed', 18000.00, TRUE, 620.00, 54, 'flight'),
(2, 'Weekend in Rishikesh', 'Rishikesh, Uttarakhand', '2026-07-18', '2026-07-20', 'ongoing', 9000.00, TRUE, 240.00, 82, 'train'),
(3, 'Kerala Backwaters Tour', 'Alleppey, Kerala', '2026-06-01', '2026-06-06', 'completed', 22000.00, FALSE, 340.00, 88, 'train'),
(4, 'Rajasthan Heritage Trip', 'Jaipur, Rajasthan', '2026-09-15', '2026-09-22', 'planned', 30000.00, TRUE, 280.00, 61, 'car');

-- ---------------------------------------------------------
-- ITINERARIES
-- ---------------------------------------------------------
INSERT INTO itineraries (trip_id, day_number, activity_title, location, start_time, notes) VALUES
(1, 1, 'Arrival & Local Market Walk', 'Manali Mall Road', '10:00:00', 'Check into hostel, explore local cafes'),
(1, 2, 'Solang Valley Adventure Sports', 'Solang Valley', '09:00:00', 'Paragliding + zorbing'),
(1, 3, 'Trek to Jogini Waterfall', 'Vashisht', '07:30:00', 'Carry water and snacks'),
(2, 1, 'Beach Relaxation', 'Baga Beach', '11:00:00', 'Sunset at the beach shacks'),
(3, 1, 'Houseboat Check-in', 'Alleppey Backwaters', '12:00:00', 'Traditional Kerala lunch onboard');

-- ---------------------------------------------------------
-- EXPENSES
-- ---------------------------------------------------------
INSERT INTO expenses (trip_id, user_id, category, amount, description, is_ocr_scanned, expense_date) VALUES
(1, 2, 'transport', 3500.00, 'Volvo bus Delhi to Manali', FALSE, '2026-08-10'),
(1, 2, 'stay', 6000.00, 'Hostel booking - 4 nights', TRUE, '2026-08-10'),
(1, 2, 'food', 1200.00, 'Local dhaba meals', TRUE, '2026-08-11'),
(2, 2, 'stay', 8000.00, 'Beach resort - 3 nights', TRUE, '2026-03-05'),
(2, 2, 'activities', 2500.00, 'Water sports package', FALSE, '2026-03-06'),
(3, 3, 'stay', 10000.00, 'Houseboat rental', TRUE, '2026-06-01'),
(3, 3, 'food', 1800.00, 'Kerala cuisine meals', FALSE, '2026-06-02');

-- ---------------------------------------------------------
-- TRIP MEMBERS (group travel)
-- ---------------------------------------------------------
INSERT INTO trip_members (trip_id, user_id, role) VALUES
(1, 2, 'owner'),
(1, 3, 'member'),
(2, 2, 'owner'),
(3, 3, 'owner'),
(4, 4, 'owner');

-- ---------------------------------------------------------
-- SOS ALERTS (sample historical, resolved)
-- ---------------------------------------------------------
INSERT INTO sos_alerts (user_id, trip_id, latitude, longitude, message, status, resolved_at) VALUES
(3, 3, 9.4981, 76.3388, 'Lost network connectivity near backwaters', 'resolved', '2026-06-02 15:30:00');

-- ---------------------------------------------------------
-- FEEDBACK
-- ---------------------------------------------------------
INSERT INTO feedback (name, email, subject, message, status) VALUES
('Priya Nair', 'priya@example.com', 'Great App Idea', 'Loved the SOS and OCR expense features, works smoothly!', 'reviewed'),
('Arjun Mehta', 'arjun@example.com', 'Feature Suggestion', 'Please add offline maps support for remote treks.', 'new');

-- ---------------------------------------------------------
-- JOURNALS (AI Memory Highlights)
-- ---------------------------------------------------------
INSERT INTO journals (trip_id, user_id, title, content, mood, ai_highlight, entry_date) VALUES
(2, 2, 'Sunset at Baga Beach', 'Watched the most incredible sunset today, the sky turned orange and pink over the Arabian Sea.', 'relaxed', TRUE, '2026-03-06'),
(2, 2, 'Water Sports Day', 'Tried parasailing for the first time — terrifying and amazing at once!', 'excited', TRUE, '2026-03-07'),
(3, 3, 'Houseboat Mornings', 'Woke up to birds chirping on the backwaters, coconut trees on both banks.', 'nostalgic', TRUE, '2026-06-02');

-- ---------------------------------------------------------
-- TRIP ROUTE POINTS (Live Trip Demo — Rishikesh weekend trip)
-- ---------------------------------------------------------
INSERT INTO trip_route_points (trip_id, latitude, longitude, label) VALUES
(3, 28.7041, 77.1025, 'Delhi - Trip Start'),
(3, 29.1200, 78.5600, 'Roorkee - Rest Stop'),
(3, 29.8543, 78.1642, 'Haridwar - Ganga Aarti'),
(3, 30.0869, 78.2676, 'Rishikesh - Camp Arrival');

-- ---------------------------------------------------------
-- CHAT MESSAGES (AI Assistant sample thread)
-- ---------------------------------------------------------
INSERT INTO chat_messages (user_id, trip_id, sender, message) VALUES
(2, 3, 'user', 'What should I pack for a Rishikesh weekend in July?'),
(2, 3, 'assistant', 'Light cottons, a rain jacket for monsoon showers, quick-dry sandals for the ghats, and a dry bag if you plan to raft.'),
(2, 3, 'user', 'Any good vegetarian food spots near Laxman Jhula?'),
(2, 3, 'assistant', 'Chotiwala and Ganga Beach Cafe are popular near Laxman Jhula for thalis and rooftop river views.');
