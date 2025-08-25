-- Add isActive field to categories table
ALTER TABLE categories ADD COLUMN isActive BOOLEAN DEFAULT TRUE;

-- Add isActive field to suppliers table  
ALTER TABLE suppliers ADD COLUMN isActive BOOLEAN DEFAULT TRUE;

-- Add isActive field to users table
ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT TRUE;

-- Update existing records to be active
UPDATE categories SET isActive = TRUE WHERE isActive IS NULL;
UPDATE suppliers SET isActive = TRUE WHERE isActive IS NULL;
UPDATE users SET isActive = TRUE WHERE isActive IS NULL;
