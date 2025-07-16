-- Database update to add email and resident_type fields
-- Run this in your Supabase SQL editor

-- Add email field
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL DEFAULT '';

-- Add resident_type field
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

-- Update existing records to have default values
UPDATE donations 
SET email = 'noemail@example.com' 
WHERE email = '';

UPDATE donations 
SET resident_type = 'Sankalp Resident' 
WHERE resident_type = '';

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(email);
CREATE INDEX IF NOT EXISTS idx_donations_resident_type ON donations(resident_type);

-- Create or update the view for donation statistics
CREATE OR REPLACE VIEW donation_stats AS
SELECT 
  building,
  resident_type,
  COUNT(*) as total_donations,
  SUM(amount_paid) as total_collected,
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) as completed_donations,
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) as pending_donations,
  SUM(CASE WHEN payment_status = 'Pending' THEN balance_amount ELSE 0 END) as pending_amount
FROM donations
GROUP BY building, resident_type
ORDER BY building, resident_type;

-- Create a view for donor contact information
CREATE OR REPLACE VIEW donor_contacts AS
SELECT 
  name,
  phone,
  email,
  resident_type,
  CASE 
    WHEN resident_type = 'Sankalp Resident' THEN CONCAT(wing, '-', flat, ', ', building)
    ELSE 'Outsider'
  END as address,
  payment_status,
  amount_paid,
  balance_amount,
  created_at
FROM donations
ORDER BY created_at DESC;

COMMENT ON TABLE donations IS 'Donation records with email and resident type support';
COMMENT ON COLUMN donations.email IS 'Donor email address';
COMMENT ON COLUMN donations.resident_type IS 'Whether donor is Sankalp Resident or Outsider';
COMMENT ON COLUMN donations.wing IS 'Wing (nullable for outsiders)';
COMMENT ON COLUMN donations.flat IS 'Flat number (nullable for outsiders)';
COMMENT ON COLUMN donations.building IS 'Building name (nullable for outsiders)';
