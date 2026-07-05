-- =========================================================
-- TravelPilot Database Schema
-- SIH 2025 - Smart Travel Companion
-- MySQL 8.x
-- =========================================================

DROP DATABASE IF EXISTS travelpilot;
CREATE DATABASE travelpilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travelpilot;

-- ---------------------------------------------------------
-- USERS  (Tourist / Admin)
-- ---------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  reset_token_hash VARCHAR(255) NULL,
  reset_token_expires TIMESTAMP NULL,
  google_id VARCHAR(255) NULL UNIQUE,
  role ENUM('tourist', 'admin') NOT NULL DEFAULT 'tourist',
  phone VARCHAR(20),
  upi_id VARCHAR(50),
  avatar_url VARCHAR(255),
  emergency_contact VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- TRIPS
-- ---------------------------------------------------------
CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  destination VARCHAR(150) NOT NULL,
  dest_lat DECIMAL(10,7) NULL,
  dest_lng DECIMAL(10,7) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('planned', 'ongoing', 'completed', 'cancelled') DEFAULT 'planned',
  budget DECIMAL(10,2) DEFAULT 0,
  cover_image VARCHAR(255),
  auto_tracked BOOLEAN DEFAULT FALSE,
  distance_km DECIMAL(8,2) DEFAULT 0,
  eco_score INT DEFAULT 0,
  transport_mode ENUM('train','bus','flight','car','bike','walk','mixed') DEFAULT 'mixed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- ITINERARIES  (day-by-day plan items within a trip)
-- ---------------------------------------------------------
CREATE TABLE itineraries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  day_number INT NOT NULL,
  activity_title VARCHAR(150) NOT NULL,
  location VARCHAR(150),
  start_time TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- EXPENSES  (supports OCR-scanned receipts)
-- ---------------------------------------------------------
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  user_id INT NULL,
  paid_by_member_id INT NULL,
  category ENUM('food','transport','stay','shopping','activities','other') DEFAULT 'other',
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  description VARCHAR(255),
  receipt_image VARCHAR(255),
  is_ocr_scanned BOOLEAN DEFAULT FALSE,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- GROUP TRAVEL MEMBERS
-- ---------------------------------------------------------
CREATE TABLE trip_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  user_id INT NULL,
  invite_name VARCHAR(100) NULL,
  invite_phone VARCHAR(20) NULL,
  upi_id VARCHAR(50) NULL,
  role ENUM('owner','member') DEFAULT 'member',
  status ENUM('invited','joined','declined') NOT NULL DEFAULT 'joined',
  location_shared BOOLEAN NOT NULL DEFAULT FALSE,
  last_lat DECIMAL(10,7) NULL,
  last_lng DECIMAL(10,7) NULL,
  last_seen_at TIMESTAMP NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member (trip_id, user_id)
) ENGINE=InnoDB;

-- Deferred FK: expenses is created earlier in this file, before
-- trip_members exists, so this link is added here instead.
ALTER TABLE expenses
  ADD CONSTRAINT fk_expense_paid_by_member
  FOREIGN KEY (paid_by_member_id) REFERENCES trip_members(id) ON DELETE SET NULL;

-- ---------------------------------------------------------
-- EMERGENCY CONTACTS  (Safety Hub — persisted per user)
-- ---------------------------------------------------------
CREATE TABLE emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- SOS ALERTS
-- ---------------------------------------------------------
CREATE TABLE sos_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  trip_id INT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  message VARCHAR(255),
  status ENUM('active','resolved','false_alarm') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- JOURNALS  (AI Memory Highlights source data)
-- ---------------------------------------------------------
CREATE TABLE journals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  mood ENUM('excited','happy','relaxed','tired','adventurous','nostalgic') DEFAULT 'happy',
  photo_url VARCHAR(255),
  ai_highlight BOOLEAN DEFAULT FALSE,
  entry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- TRIP ROUTE POINTS  (backs the Live Trip Demo map + timeline)
-- ---------------------------------------------------------
CREATE TABLE trip_route_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  label VARCHAR(150),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- AI ASSISTANT CHAT LOG
-- ---------------------------------------------------------
CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  trip_id INT,
  sender ENUM('user','assistant') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- PACKING CHECKLIST  (per trip, per user)
-- ---------------------------------------------------------
CREATE TABLE packing_items (
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

-- ---------------------------------------------------------
-- SYSTEM SETTINGS  (Admin Panel > System Settings)
-- ---------------------------------------------------------
CREATE TABLE system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- FEEDBACK / CONTACT MESSAGES
-- ---------------------------------------------------------
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(150),
  message TEXT NOT NULL,
  status ENUM('new','reviewed','resolved') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------
CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_expenses_trip ON expenses(trip_id);
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_sos_status ON sos_alerts(status);
CREATE INDEX idx_journals_trip ON journals(trip_id);
CREATE INDEX idx_route_points_trip ON trip_route_points(trip_id);
CREATE INDEX idx_chat_user ON chat_messages(user_id);
CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id);
CREATE INDEX idx_packing_trip ON packing_items(trip_id);

INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('maintenance_mode', 'off'),
  ('allow_registrations', 'on'),
  ('sos_auto_escalate_minutes', '15'),
  ('ai_assistant_enabled', 'on'),
  ('app_version', '2.1.0');
