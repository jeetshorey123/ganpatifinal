-- 🗄️ COMPLETE UPDATED SUPABASE SETUP WITH RECEIPT URLs
-- This script ensures all necessary columns exist and creates proper structure
-- Run this entire script in your Supabase SQL Editor

-- ========================================
-- 🔧 ENSURE NECESSARY COLUMNS EXIST
-- ========================================

-- Add all required columns if they don't exist
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS resident_type VARCHAR(50) NOT NULL DEFAULT 'Sankalp Resident'
    CHECK (resident_type IN ('Sankalp Resident', 'Outsider')),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS wing VARCHAR(10),
ADD COLUMN IF NOT EXISTS flat VARCHAR(10),
ADD COLUMN IF NOT EXISTS building VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ========================================
-- 🔄 MODIFY COLUMNS FOR OUTSIDERS
-- ========================================

-- Allow wing, flat, building to be NULL for Outsiders
ALTER TABLE donations
ALTER COLUMN wing DROP NOT NULL,
ALTER COLUMN flat DROP NOT NULL,
ALTER COLUMN building DROP NOT NULL;

-- ========================================
-- 📝 UPDATE MISSING VALUES
-- ========================================

-- Update missing email values
UPDATE donations
SET email = 'noemail@example.com'
WHERE email IS NULL OR email = '';

-- Update missing resident_type values
UPDATE donations
SET resident_type = 'Sankalp Resident'
WHERE resident_type IS NULL OR resident_type = '';

-- Update missing payment_status values
UPDATE donations
SET payment_status = 'Pending'
WHERE payment_status IS NULL OR payment_status = '';

-- Update missing payment_method values
UPDATE donations
SET payment_method = 'Cash'
WHERE payment_method IS NULL OR payment_method = '';

-- Recalculate balance amount for all records
UPDATE donations
SET balance_amount = COALESCE(total_amount, 0) - COALESCE(amount_paid, 0);

-- ========================================
-- 📈 CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_donations_phone;
DROP INDEX IF EXISTS idx_donations_email;
DROP INDEX IF EXISTS idx_donations_resident_type;
DROP INDEX IF EXISTS idx_donations_payment_status;
DROP INDEX IF EXISTS idx_donations_payment_method;
DROP INDEX IF EXISTS idx_donations_created_at;
DROP INDEX IF EXISTS idx_donations_receipt_url;

-- Create new indexes
CREATE INDEX idx_donations_phone ON donations(phone);
CREATE INDEX idx_donations_email ON donations(email);
CREATE INDEX idx_donations_resident_type ON donations(resident_type);
CREATE INDEX idx_donations_payment_status ON donations(payment_status);
CREATE INDEX idx_donations_payment_method ON donations(payment_method);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_receipt_url ON donations(receipt_url) WHERE receipt_url IS NOT NULL;

-- ========================================
-- 🏠 CREATE ADDRESS VIEW
-- ========================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS donations_with_address;

-- Create view with combined address field
CREATE VIEW donations_with_address AS
SELECT
  id,
  name,
  phone,
  CASE 
    WHEN wing IS NOT NULL AND flat IS NOT NULL AND building IS NOT NULL THEN 
      CONCAT_WS(', ', flat, wing, building)
    WHEN wing IS NOT NULL AND flat IS NOT NULL THEN 
      CONCAT_WS(', ', flat, wing)
    WHEN building IS NOT NULL THEN 
      building
    ELSE 
      'Address not provided'
  END AS address,
  email,
  payment_status,
  payment_method,
  total_amount,
  amount_paid,
  balance_amount,
  resident_type,
  receipt_url,
  wing,
  flat,
  building,
  created_at,
  updated_at
FROM donations;

-- ========================================
-- 🔄 AUTO-UPDATE TRIGGERS
-- ========================================

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS trigger_update_balance_amount ON donations;
DROP FUNCTION IF EXISTS update_balance_amount();

-- Create function to automatically calculate balance_amount and update timestamp
CREATE OR REPLACE FUNCTION update_donation_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate balance amount
  NEW.balance_amount = COALESCE(NEW.total_amount, 0) - COALESCE(NEW.amount_paid, 0);
  
  -- Update timestamp
  NEW.updated_at = CURRENT_TIMESTAMP;
  
  -- Ensure balance is not negative
  IF NEW.balance_amount < 0 THEN
    NEW.balance_amount = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updates
CREATE TRIGGER trigger_update_donation_fields
  BEFORE INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_donation_fields();

-- ========================================
-- 📁 STORAGE BUCKET SETUP
-- ========================================

-- Create receipts bucket for PDF storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts', 
  'receipts', 
  true, 
  5242880, -- 5MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf'];

-- ========================================
-- 🔐 STORAGE POLICIES
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access on receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access on receipts" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access on receipts" ON storage.objects;

-- Public read access for receipt PDFs
CREATE POLICY "Public read access on receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

-- Authenticated users can upload receipts
CREATE POLICY "Authenticated upload access on receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated'
);

-- Service role has full access (for backend operations)
CREATE POLICY "Service role full access on receipts" ON storage.objects
FOR ALL USING (
  bucket_id = 'receipts' 
  AND auth.role() = 'service_role'
);

-- ========================================
-- 📊 ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on donations table
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access" ON donations;
DROP POLICY IF EXISTS "Authenticated insert access" ON donations;
DROP POLICY IF EXISTS "Service role full access" ON donations;

-- Policy for public read access (for frontend)
CREATE POLICY "Public read access" ON donations
FOR SELECT USING (true);

-- Policy for authenticated insert (for frontend form submissions)
CREATE POLICY "Authenticated insert access" ON donations
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Policy for service role full access (for backend operations)
CREATE POLICY "Service role full access" ON donations
FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- 📝 SAMPLE DATA (IF TABLE IS EMPTY)
-- ========================================

-- Insert sample data only if table is empty
INSERT INTO donations (
  name, phone, email, wing, flat, building, resident_type,
  payment_method, payment_status, total_amount, amount_paid
)
SELECT * FROM (VALUES
  ('Rajesh Sharma', '9833232395', 'rajesh@example.com', 'A', '101', 'Sankalp Heights', 'Sankalp Resident', 'Cash', 'Completed', 500.00, 500.00),
  ('Priya Patel', '9876543210', 'priya@example.com', 'B', '202', 'Sankalp Heights', 'Sankalp Resident', 'Online', 'Completed', 1000.00, 1000.00),
  ('Amit Kumar', '8765432109', 'amit@example.com', 'C', '303', 'Sankalp Heights', 'Sankalp Resident', 'Bank Transfer', 'Pending', 750.00, 250.00),
  ('Neha Gupta', '7654321098', 'neha@example.com', NULL, NULL, NULL, 'Outsider', 'Online', 'Completed', 2000.00, 2000.00),
  ('Dr. Suresh Mehta', '6543210987', 'suresh@example.com', NULL, NULL, NULL, 'Outsider', 'Cheque', 'Completed', 5000.00, 5000.00)
) AS sample_data(name, phone, email, wing, flat, building, resident_type, payment_method, payment_status, total_amount, amount_paid)
WHERE NOT EXISTS (SELECT 1 FROM donations LIMIT 1);

-- ========================================
-- 📈 USEFUL VIEWS FOR REPORTING
-- ========================================

-- Create donation summary view
DROP VIEW IF EXISTS donation_summary;
CREATE OR REPLACE VIEW donation_summary AS
SELECT 
  COUNT(*) as total_donations,
  SUM(total_amount) as total_amount_pledged,
  SUM(amount_paid) as total_amount_collected,
  SUM(balance_amount) as total_balance_pending,
  COUNT(CASE WHEN payment_status = 'Completed' THEN 1 END) as completed_donations,
  COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) as pending_donations,
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) as receipts_generated,
  COUNT(CASE WHEN resident_type = 'Sankalp Resident' THEN 1 END) as resident_donations,
  COUNT(CASE WHEN resident_type = 'Outsider' THEN 1 END) as outside_donations,
  ROUND(AVG(total_amount), 2) as average_donation,
  ROUND(
    COUNT(CASE WHEN payment_status = 'Completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2
  ) as completion_percentage
FROM donations;

-- Create view for donations with receipt status
DROP VIEW IF EXISTS donations_with_receipt_status;
CREATE OR REPLACE VIEW donations_with_receipt_status AS
SELECT 
  d.*,
  CASE 
    WHEN d.receipt_url IS NOT NULL THEN true
    ELSE false
  END as has_receipt,
  CASE 
    WHEN d.receipt_url IS NOT NULL THEN 'Generated'
    ELSE 'Pending'
  END as receipt_status
FROM donations_with_address d;

-- ========================================
-- 🔧 UTILITY FUNCTIONS
-- ========================================

-- Function to get donation statistics
CREATE OR REPLACE FUNCTION get_donation_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT row_to_json(ds) INTO result
  FROM donation_summary ds;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update receipt URL for a donation
CREATE OR REPLACE FUNCTION update_receipt_url(
  donation_id integer,
  new_receipt_url text
)
RETURNS json AS $$
DECLARE
  rows_affected integer;
  result json;
  updated_record donations%ROWTYPE;
BEGIN
  UPDATE donations 
  SET receipt_url = new_receipt_url,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = donation_id
  RETURNING * INTO updated_record;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    SELECT json_build_object(
      'success', true,
      'message', 'Receipt URL updated successfully',
      'donation_id', donation_id,
      'receipt_url', new_receipt_url,
      'updated_at', updated_record.updated_at
    ) INTO result;
  ELSE
    SELECT json_build_object(
      'success', false,
      'message', 'Donation not found',
      'donation_id', donation_id
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to search donations
CREATE OR REPLACE FUNCTION search_donations(search_term text)
RETURNS TABLE (
  id integer,
  name varchar,
  phone varchar,
  address text,
  email varchar,
  payment_status varchar,
  payment_method varchar,
  total_amount decimal,
  amount_paid decimal,
  balance_amount decimal,
  receipt_url text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, d.name, d.phone, d.address, d.email,
    d.payment_status, d.payment_method,
    d.total_amount, d.amount_paid, d.balance_amount,
    d.receipt_url, d.created_at
  FROM donations_with_address d
  WHERE 
    d.name ILIKE '%' || search_term || '%' OR
    d.phone ILIKE '%' || search_term || '%' OR
    d.email ILIKE '%' || search_term || '%' OR
    d.address ILIKE '%' || search_term || '%'
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 🔍 VERIFICATION QUERIES
-- ========================================

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'donations' 
ORDER BY ordinal_position;

-- Check sample data with address
SELECT 
  id,
  name,
  phone,
  address,
  email,
  payment_status,
  payment_method,
  total_amount,
  amount_paid,
  balance_amount,
  CASE 
    WHEN receipt_url IS NOT NULL THEN '✅ Has Receipt'
    ELSE '❌ No Receipt'
  END as receipt_status,
  created_at
FROM donations_with_address 
ORDER BY created_at DESC
LIMIT 10;

-- Check storage bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'receipts';

-- ========================================
-- ✅ FINAL VERIFICATION AND SUMMARY
-- ========================================

-- Display setup summary
SELECT 
  '✅ SETUP COMPLETE!' as status,
  (SELECT COUNT(*) FROM donations) as total_donations,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'receipts') as storage_buckets,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'donations') as table_columns;

-- Display donation statistics
SELECT '📊 DONATION STATISTICS:' as info;
SELECT get_donation_stats() as statistics;

-- Display sample data with addresses
SELECT 
  '📝 SAMPLE DATA WITH ADDRESSES:' as info,
  id,
  name,
  phone,
  address,
  payment_status,
  total_amount,
  amount_paid,
  balance_amount,
  CASE 
    WHEN receipt_url IS NOT NULL THEN '✅'
    ELSE '❌'
  END as receipt
FROM donations_with_address 
ORDER BY id
LIMIT 5;

-- Display next steps
SELECT 
  '🚀 NEXT STEPS:' as info,
  '1. Backend server running on port 3001' as step1,
  '2. Test API: POST /api/donations/with-receipt' as step2,
  '3. Use donations_with_address view for combined address' as step3,
  '4. Test receipt URL generation and storage' as step4;

-- ========================================
-- 📋 QUICK REFERENCE
-- ========================================

/*
🗄️ TABLE STRUCTURE:
- donations (Main table with all columns)
- donations_with_address (View with combined address field)
- donations_with_receipt_status (View with receipt status)
- donation_summary (View with statistics)

🔍 USEFUL QUERIES:
- SELECT * FROM donations_with_address; (View donations with combined address)
- SELECT * FROM donations_with_receipt_status; (View with receipt status)
- SELECT get_donation_stats(); (Get overall statistics)
- SELECT search_donations('search_term'); (Search function)
- SELECT update_receipt_url(1, 'https://example.com/receipt.pdf'); (Update receipt URL)

📁 STORAGE:
- Bucket: receipts (Public access enabled)
- File format: receipt_{id}_{date}_{time}.pdf
- URL format: https://your-project.supabase.co/storage/v1/object/public/receipts/{filename}

🔗 API ENDPOINTS TO USE:
- POST /api/donations/with-receipt (Create donation + send receipts)
- GET /api/donations/with-receipts (Get all donations with receipt URLs)
- GET /api/donations/:id/receipt-url (Get specific receipt URL)
- PUT /api/donations/:id/receipt-url (Update receipt URL)

📊 VIEWS AVAILABLE:
- donations_with_address (Shows combined address from wing, flat, building)
- donations_with_receipt_status (Shows receipt generation status)
- donation_summary (Shows overall statistics)
*/