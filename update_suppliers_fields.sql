-- Add address field to suppliers table
ALTER TABLE `suppliers` ADD COLUMN `address` TEXT DEFAULT NULL AFTER `contact`;

-- Update the table structure to include all required fields
-- The table should now have: supplier_id, name, email, phone, contact, address, isActive
