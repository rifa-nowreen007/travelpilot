-- =========================================================
-- TravelPilot Migration v2
-- Adds: real destination coordinates for the map, a proper
-- emergency-contacts table, and real group-trip member state
-- (invite status, consent-based location sharing, last known
-- position) so the Group Trip + Safety + Tracking pages can be
-- backed by real data instead of local mock state.
--
-- Run this against an existing `travelpilot` database:
--   mysql -u root -p travelpilot < database/migration_v2.sql
-- =========================================================
USE travelpilot;

-- ---------------------------------------------------------
-- Real coordinates for a trip's destination, so the map has
-- something to plot the moment a trip is created (geocoded
-- automatically server-side from the typed destination).
-- ---------------------------------------------------------
ALTER TABLE trips
  ADD COLUMN dest_lat DECIMAL(10,7) NULL AFTER destination,
  ADD COLUMN dest_lng DECIMAL(10,7) NULL AFTER dest_lat;

-- ---------------------------------------------------------
-- EMERGENCY CONTACTS — previously only lived in the browser's
-- local React state on the Safety page and vanished on refresh.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id);

-- ---------------------------------------------------------
-- GROUP TRIP MEMBERS — extend to support inviting someone who
-- doesn't have an account yet (by phone), a real invite/consent
-- state, and a last-known live location per member (only ever
-- written by that member themselves, only ever read by other
-- members if location_shared = TRUE).
-- ---------------------------------------------------------
ALTER TABLE trip_members
  MODIFY COLUMN user_id INT NULL,
  ADD COLUMN invite_name VARCHAR(100) NULL AFTER user_id,
  ADD COLUMN invite_phone VARCHAR(20) NULL AFTER invite_name,
  ADD COLUMN status ENUM('invited','joined','declined') NOT NULL DEFAULT 'joined' AFTER role,
  ADD COLUMN location_shared BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
  ADD COLUMN last_lat DECIMAL(10,7) NULL AFTER location_shared,
  ADD COLUMN last_lng DECIMAL(10,7) NULL AFTER last_lat,
  ADD COLUMN last_seen_at TIMESTAMP NULL AFTER last_lng;
