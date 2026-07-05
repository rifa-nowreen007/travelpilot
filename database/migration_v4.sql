-- =========================================================
-- TravelPilot Migration v4
-- Adds: forgot-password reset tokens, and Google Sign-In linkage.
--
-- Run: mysql -u root -p travelpilot < database/migration_v4.sql
-- =========================================================
USE travelpilot;

ALTER TABLE users
  ADD COLUMN reset_token_hash VARCHAR(255) NULL AFTER password_hash,
  ADD COLUMN reset_token_expires TIMESTAMP NULL AFTER reset_token_hash,
  ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER reset_token_expires;
