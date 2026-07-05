-- Migration v7: Photo attachments in group chat
--   mysql -u root -p travelpilot < database/migration_v7.sql

USE travelpilot;

ALTER TABLE group_messages
  ADD COLUMN photo_url VARCHAR(500) NULL AFTER message;

-- message can now be empty if the person only sent a photo
ALTER TABLE group_messages
  MODIFY COLUMN message TEXT NULL;
