-- =========================================================
-- TravelPilot Migration v5
-- Adds: packing checklist items (per trip, per user).
--
-- Run: mysql -u root -p travelpilot < database/migration_v5.sql
-- =========================================================
USE travelpilot;

CREATE TABLE IF NOT EXISTS packing_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  user_id INT NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  category ENUM('clothing','toiletries','electronics','documents','health','misc') DEFAULT 'misc',
  quantity INT DEFAULT 1,
  is_packed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_packing_trip ON packing_items(trip_id);
