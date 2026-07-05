-- Migration v6: Real-time group trip chat
-- Run this after schema.sql + any earlier migrations you already applied:
--   mysql -u root -p travelpilot < database/migration_v6.sql

USE travelpilot;

CREATE TABLE IF NOT EXISTS group_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_messages_trip (trip_id, created_at)
) ENGINE=InnoDB;
