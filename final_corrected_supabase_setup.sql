-- Final corrected Supabase setup to fix missing columns
-- Run this in your Supabase SQL editor to fix the database schema

-- Add email column
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL DEFAULT '';

-- Add resident_type column  
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS resident_type VARCHAR(50) NOT NULL DEFAULT 'Sankalp Resident' 
CHECK (resident_type IN ('Sankalp Resident', 'Outsider'));

-- Make wing, flat, and building nullable for outsiders
ALTER TABLE donations 
ALTER COLUMN wing DROP NOT NULL;

ALTER TABLE donations 
ALTER COLUMN flat DROP NOT NULL;

ALTER TABLE donations 
ALTER COLUMN building DROP NOT NULL;

-- Fix balance_amount column - drop it if it's a computed column and recreate as regular column
ALTER TABLE donations 
DROP COLUMN IF EXISTS balance_amount;

-- Recreate balance_amount as a regular column
ALTER TABLE donations 
ADD COLUMN balance_amount DECIMAL(10,2) DEFAULT 0;

-- Update existing records to have proper default values
UPDATE donations 
SET email = 'noemail@example.com' 
WHERE email = '' OR email IS NULL;

UPDATE donations 
SET resident_type = 'Sankalp Resident' 
WHERE resident_type = '' OR resident_type IS NULL;

-- Calculate balance_amount for existing records
UPDATE donations 
SET balance_amount = total_amount - amount_paid;

-- Add receipt_url column if it doesn't exist
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(email);
CREATE INDEX IF NOT EXISTS idx_donations_resident_type ON donations(resident_type);
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON donations(payment_status);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'donations' 
ORDER BY ordinal_position;

-- Show sample data to verify updates
SELECT * FROM donations LIMIT 3;