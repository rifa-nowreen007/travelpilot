-- =========================================================
-- TravelPilot Migration v3
-- Adds: personal UPI IDs (for real UPI payment-request links),
-- and group-expense attribution to any trip member (not just
-- the trip owner) so "Paid by Karan" actually means Karan,
-- even if Karan hasn't created an account yet.
--
-- Run: mysql -u root -p travelpilot < database/migration_v3.sql
-- =========================================================
USE travelpilot;

-- A personal UPI ID users can optionally save, used to build real
-- upi://pay request links so trip-mates can settle balances instantly.
ALTER TABLE users
  ADD COLUMN upi_id VARCHAR(50) NULL AFTER phone;

-- Same idea for invited (possibly unregistered) trip members.
ALTER TABLE trip_members
  ADD COLUMN upi_id VARCHAR(50) NULL AFTER invite_phone;

-- Let an expense be attributed to a trip_members row (works even for an
-- invited member with no account yet), independent of who's logged in and
-- actually clicking "Add expense". user_id becomes nullable to match.
ALTER TABLE expenses
  MODIFY COLUMN user_id INT NULL,
  ADD COLUMN paid_by_member_id INT NULL AFTER user_id,
  ADD CONSTRAINT fk_expense_paid_by_member
    FOREIGN KEY (paid_by_member_id) REFERENCES trip_members(id) ON DELETE SET NULL;
