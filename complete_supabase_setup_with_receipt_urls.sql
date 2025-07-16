-- 🗄️ COMPLETE UPDATED SUPABASE SETUP WITH RECEIPT URLs
-- Run this entire script in your Supabase SQL Editor
-- This will create a fresh donations table with receipt_url column and all necessary configurations

-- ========================================
-- 🧹 CLEAN SLATE: Drop existing tables
-- ========================================

-- Drop existing table and dependencies
DROP TABLE IF EXISTS donations CASCADE;
DROP FUNCTION IF EXISTS update_balance_amount() CASCADE;
DROP TRIGGER IF EXISTS trigger_update_balance_amount ON donations;

-- ========================================
-- 📊 CREATE DONATIONS TABLE WITH RECEIPT_URL
-- ========================================

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
  receipt_url TEXT, -- 🔗 NEW: Stores public PDF receipt URLs
  notes TEXT, -- Additional notes for the donation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 📈 CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Primary indexes for frequent queries
CREATE INDEX idx_donations_phone ON donations(phone);
CREATE INDEX idx_donations_email ON donations(email);
CREATE INDEX idx_donations_resident_type ON donations(resident_type);
CREATE INDEX idx_donations_payment_status ON donations(payment_status);
CREATE INDEX idx_donations_payment_method ON donations(payment_method);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_updated_at ON donations(updated_at DESC);

-- Receipt-specific indexes
CREATE INDEX idx_donations_receipt_url ON donations(receipt_url) WHERE receipt_url IS NOT NULL;
CREATE INDEX idx_donations_has_receipt ON donations((receipt_url IS NOT NULL));

-- Composite indexes for common queries
CREATE INDEX idx_donations_status_date ON donations(payment_status, created_at DESC);
CREATE INDEX idx_donations_resident_amount ON donations(resident_type, total_amount DESC);

-- ========================================
-- 🔄 AUTO-UPDATE TRIGGERS
-- ========================================

-- Function to automatically calculate balance_amount and update timestamp
CREATE OR REPLACE FUNCTION update_donation_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate balance amount
  NEW.balance_amount = NEW.total_amount - NEW.amount_paid;
  
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
-- 📝 SAMPLE DATA FOR TESTING
-- ========================================

-- Insert sample donations with different scenarios
INSERT INTO donations (
  name, phone, email, wing, flat, building, resident_type,
  payment_method, payment_status, total_amount, amount_paid, notes
) VALUES 
-- Completed donations (residents)
(
  'Rajesh Sharma', '9833232395', 'rajesh@example.com', 
  'A', '101', 'Sankalp Heights', 'Sankalp Resident',
  'Cash', 'Completed', 500.00, 500.00, 'Full payment received in cash'
),
(
  'Priya Patel', '9876543210', 'priya@example.com', 
  'B', '202', 'Sankalp Heights', 'Sankalp Resident',
  'Online', 'Completed', 1000.00, 1000.00, 'Paid via UPI'
),
-- Partial payment
(
  'Amit Kumar', '8765432109', 'amit@example.com', 
  'C', '303', 'Sankalp Heights', 'Sankalp Resident',
  'Bank Transfer', 'Pending', 750.00, 250.00, 'Partial payment received, balance pending'
),
-- Outside donors
(
  'Neha Gupta', '7654321098', 'neha@example.com', 
  NULL, NULL, NULL, 'Outsider',
  'Online', 'Completed', 2000.00, 2000.00, 'Outside donor contribution'
),
(
  'Dr. Suresh Mehta', '6543210987', 'suresh@example.com', 
  NULL, NULL, NULL, 'Outsider',
  'Cheque', 'Completed', 5000.00, 5000.00, 'Large donation via cheque'
);

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

-- Check sample data with calculated fields
SELECT 
  id,
  name,
  phone,
  email,
  COALESCE(wing || '-' || flat, 'Outside') as address,
  resident_type,
  payment_method,
  payment_status,
  total_amount,
  amount_paid,
  balance_amount,
  CASE 
    WHEN receipt_url IS NOT NULL THEN 'Has Receipt'
    ELSE 'No Receipt'
  END as receipt_status,
  created_at
FROM donations 
ORDER BY created_at DESC;

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
-- 📈 USEFUL VIEWS FOR REPORTING
-- ========================================

-- Create view for donation summary
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
  COUNT(CASE WHEN resident_type = 'Outsider' THEN 1 END) as outside_donations
FROM donations;

-- Create view for donations with receipt status
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
FROM donations d;

-- ========================================
-- 🔧 UTILITY FUNCTIONS
-- ========================================

-- Function to get donation statistics
CREATE OR REPLACE FUNCTION get_donation_stats()
RETURNS TABLE (
  total_donations bigint,
  total_amount_pledged numeric,
  total_amount_collected numeric,
  total_balance_pending numeric,
  completed_donations bigint,
  pending_donations bigint,
  receipts_generated bigint,
  resident_donations bigint,
  outside_donations bigint
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM donation_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to update receipt URL for a donation
CREATE OR REPLACE FUNCTION update_receipt_url(
  donation_id integer,
  new_receipt_url text
)
RETURNS TABLE (
  success boolean,
  message text,
  updated_donation_id integer
) AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE donations 
  SET receipt_url = new_receipt_url,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = donation_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    RETURN QUERY SELECT true, 'Receipt URL updated successfully', donation_id;
  ELSE
    RETURN QUERY SELECT false, 'Donation not found', donation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ✅ FINAL VERIFICATION
-- ========================================

-- Display final summary
SELECT 
  '✅ SETUP COMPLETE!' as status,
  (SELECT COUNT(*) FROM donations) as sample_donations,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'receipts') as storage_buckets,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'donations') as table_columns;

-- Display sample donations with receipt status
SELECT 
  '📊 SAMPLE DATA:' as info,
  id,
  name,
  phone,
  resident_type,
  payment_status,
  total_amount,
  CASE 
    WHEN receipt_url IS NOT NULL THEN '✅ Has Receipt'
    ELSE '❌ No Receipt'
  END as receipt_status
FROM donations 
ORDER BY id;

-- Display next steps
SELECT 
  '🚀 NEXT STEPS:' as info,
  '1. Backend server is running on port 3001' as step1,
  '2. Test API: POST /api/donations/with-receipt' as step2,
  '3. Check receipt URLs in database' as step3,
  '4. Verify PDF generation and storage' as step4;

-- ========================================
-- 📋 QUICK REFERENCE
-- ========================================

/*
🔗 API ENDPOINTS:
- POST /api/donations/with-receipt (Create donation + send receipts)
- GET /api/donations/with-receipts (Get all donations with receipt URLs)
- GET /api/donations/:id/receipt-url (Get specific receipt URL)

📊 DATABASE TABLES:
- donations (Main table with receipt_url column)
- storage.buckets (Contains 'receipts' bucket)

🔍 USEFUL QUERIES:
- SELECT * FROM donation_summary; (Get overall statistics)
- SELECT * FROM donations_with_receipt_status; (View with receipt status)
- SELECT get_donation_stats(); (Function to get stats)

📁 STORAGE:
- Bucket: receipts (Public access enabled)
- File format: receipt_{id}_{date}_{time}.pdf
- URL format: https://your-project.supabase.co/storage/v1/object/public/receipts/{filename}
*/
