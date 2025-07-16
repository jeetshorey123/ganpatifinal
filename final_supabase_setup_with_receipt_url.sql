-- 📄 Final corrected Supabase setup with receipt_url column
-- Run this in your Supabase SQL editor to fix the database schema and add PDF receipt URLs

-- Drop table if exists and recreate with proper structure
DROP TABLE IF EXISTS donations CASCADE;

-- Create donations table with all required columns including receipt_url
CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL DEFAULT '',
  wing VARCHAR(10),
  flat VARCHAR(10),
  building VARCHAR(255),
  resident_type VARCHAR(50) NOT NULL DEFAULT 'Sankalp Resident' 
    CHECK (resident_type IN ('Sankalp Resident', 'Outsider')),
  payment_method VARCHAR(50) NOT NULL 
    CHECK (payment_method IN ('Cash', 'Online', 'Bank Transfer', 'Cheque')),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending'
    CHECK (payment_status IN ('Pending', 'Completed', 'Failed', 'Cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  receipt_url TEXT, -- 🔗 New column for PDF receipt URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_donations_phone ON donations(phone);
CREATE INDEX idx_donations_email ON donations(email);
CREATE INDEX idx_donations_resident_type ON donations(resident_type);
CREATE INDEX idx_donations_payment_status ON donations(payment_status);
CREATE INDEX idx_donations_payment_method ON donations(payment_method);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_donations_receipt_url ON donations(receipt_url);

-- Create trigger to automatically update balance_amount
CREATE OR REPLACE FUNCTION update_balance_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_amount = NEW.total_amount - NEW.amount_paid;
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balance_amount
  BEFORE INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_balance_amount();

-- Insert sample data for testing
INSERT INTO donations (
  name, phone, email, wing, flat, building, resident_type,
  payment_method, payment_status, total_amount, amount_paid
) VALUES 
(
  'Test Donor', '9833232395', 'test@example.com', 
  'A', '101', 'Sample Building', 'Sankalp Resident',
  'Cash', 'Completed', 500.00, 500.00
),
(
  'Outside Donor', '9876543210', 'outside@example.com', 
  NULL, NULL, NULL, 'Outsider',
  'Online', 'Completed', 1000.00, 1000.00
),
(
  'Partial Payment', '8765432109', 'partial@example.com', 
  'B', '202', 'Test Building', 'Sankalp Resident',
  'Bank Transfer', 'Pending', 750.00, 250.00
);

-- Create storage bucket for PDF receipts if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for receipts bucket
CREATE POLICY "Public read access on receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated upload access on receipts" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'receipts');

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'donations' 
ORDER BY ordinal_position;

-- Show sample data to verify setup
SELECT 
  id, name, phone, email, resident_type, payment_method, 
  payment_status, total_amount, amount_paid, balance_amount, 
  receipt_url, created_at
FROM donations 
ORDER BY created_at DESC;

-- Show storage bucket info
SELECT * FROM storage.buckets WHERE name = 'receipts';
