-- 🗄️ SIMPLIFIED SUPABASE SETUP WITH RECEIPT URLs
-- Exact fields: name, address, number, email, payment_status, type, amount, balance, total, receipt_url
-- Run this entire script in your Supabase SQL Editor

-- ========================================
-- 🧹 CLEAN SLATE: Drop existing tables
-- ========================================

DROP TABLE IF EXISTS donations CASCADE;
DROP FUNCTION IF EXISTS update_balance_amount() CASCADE;
DROP TRIGGER IF EXISTS trigger_update_balance_amount ON donations;

-- ========================================
-- 📊 CREATE DONATIONS TABLE (SIMPLIFIED)
-- ========================================

CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  number VARCHAR(20) NOT NULL, -- Phone number
  email VARCHAR(255) NOT NULL DEFAULT '',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending'
    CHECK (payment_status IN ('Pending', 'Completed', 'Failed', 'Cancelled')),
  type VARCHAR(50) NOT NULL DEFAULT 'Cash'
    CHECK (type IN ('Cash', 'Online', 'Bank Transfer', 'Cheque', 'UPI')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- Amount paid
  balance DECIMAL(10,2) NOT NULL DEFAULT 0, -- Balance remaining
  total DECIMAL(10,2) NOT NULL, -- Total amount
  receipt_url TEXT, -- 🔗 PDF receipt URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 📈 CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX idx_donations_number ON donations(number);
CREATE INDEX idx_donations_email ON donations(email);
CREATE INDEX idx_donations_payment_status ON donations(payment_status);
CREATE INDEX idx_donations_type ON donations(type);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_receipt_url ON donations(receipt_url) WHERE receipt_url IS NOT NULL;

-- ========================================
-- 🔄 AUTO-UPDATE TRIGGER FOR BALANCE
-- ========================================

-- Function to automatically calculate balance and update timestamp
CREATE OR REPLACE FUNCTION update_donation_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate balance: total - amount paid
  NEW.balance = NEW.total - NEW.amount;
  
  -- Update timestamp
  NEW.updated_at = CURRENT_TIMESTAMP;
  
  -- Ensure balance is not negative
  IF NEW.balance < 0 THEN
    NEW.balance = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updates
CREATE TRIGGER trigger_update_donation_balance
  BEFORE INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_donation_balance();

-- ========================================
-- 📁 STORAGE BUCKET FOR RECEIPTS
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
DROP POLICY IF EXISTS "Service role full access on receipts" ON storage.objects;

-- Public read access for receipt PDFs
CREATE POLICY "Public read access on receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

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

-- Policy for public read access
CREATE POLICY "Public read access" ON donations
FOR SELECT USING (true);

-- Policy for public insert (for form submissions)
CREATE POLICY "Public insert access" ON donations
FOR INSERT WITH CHECK (true);

-- Policy for service role full access (for backend)
CREATE POLICY "Service role full access" ON donations
FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- 📝 SAMPLE DATA FOR TESTING
-- ========================================

-- Insert sample donations
INSERT INTO donations (
  name, address, number, email, payment_status, type, amount, total
) VALUES 
(
  'Rajesh Sharma', 
  'A-101, Sankalp Heights, Borivali West', 
  '9833232395', 
  'rajesh@example.com',
  'Completed', 
  'Cash', 
  500.00, 
  500.00
),
(
  'Priya Patel', 
  'B-202, Sankalp Heights, Borivali West', 
  '9876543210', 
  'priya@example.com',
  'Completed', 
  'UPI', 
  1000.00, 
  1000.00
),
(
  'Amit Kumar', 
  'C-303, Sankalp Heights, Borivali West', 
  '8765432109', 
  'amit@example.com',
  'Pending', 
  'Bank Transfer', 
  250.00, 
  750.00
),
(
  'Neha Gupta', 
  'Outside Donor, Andheri East', 
  '7654321098', 
  'neha@example.com',
  'Completed', 
  'Online', 
  2000.00, 
  2000.00
),
(
  'Dr. Suresh Mehta', 
  'Outside Donor, Bandra West', 
  '6543210987', 
  'suresh@example.com',
  'Completed', 
  'Cheque', 
  5000.00, 
  5000.00
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

-- Check sample data
SELECT 
  id,
  name,
  address,
  number,
  email,
  payment_status,
  type,
  amount,
  balance,
  total,
  CASE 
    WHEN receipt_url IS NOT NULL THEN '✅ Has Receipt'
    ELSE '❌ No Receipt'
  END as receipt_status,
  created_at
FROM donations 
ORDER BY created_at DESC;

-- ========================================
-- 📈 USEFUL VIEWS
-- ========================================

-- Create summary view
CREATE OR REPLACE VIEW donation_summary AS
SELECT 
  COUNT(*) as total_donations,
  SUM(total) as total_amount_pledged,
  SUM(amount) as total_amount_collected,
  SUM(balance) as total_balance_pending,
  COUNT(CASE WHEN payment_status = 'Completed' THEN 1 END) as completed_donations,
  COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) as pending_donations,
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) as receipts_generated
FROM donations;

-- View with receipt status
CREATE OR REPLACE VIEW donations_with_receipts AS
SELECT 
  id,
  name,
  address,
  number,
  email,
  payment_status,
  type,
  amount,
  balance,
  total,
  receipt_url,
  CASE 
    WHEN receipt_url IS NOT NULL THEN true
    ELSE false
  END as has_receipt,
  created_at,
  updated_at
FROM donations;

-- ========================================
-- 🔧 UTILITY FUNCTIONS
-- ========================================

-- Function to update receipt URL
CREATE OR REPLACE FUNCTION update_receipt_url(
  donation_id integer,
  new_receipt_url text
)
RETURNS json AS $$
DECLARE
  rows_affected integer;
  result json;
BEGIN
  UPDATE donations 
  SET receipt_url = new_receipt_url,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = donation_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    SELECT json_build_object(
      'success', true,
      'message', 'Receipt URL updated successfully',
      'donation_id', donation_id,
      'receipt_url', new_receipt_url
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

-- Function to get donation stats
CREATE OR REPLACE FUNCTION get_donation_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_donations', COUNT(*),
    'total_amount_pledged', SUM(total),
    'total_amount_collected', SUM(amount),
    'total_balance_pending', SUM(balance),
    'completed_donations', COUNT(CASE WHEN payment_status = 'Completed' THEN 1 END),
    'pending_donations', COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END),
    'receipts_generated', COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END),
    'completion_rate', ROUND(
      COUNT(CASE WHEN payment_status = 'Completed' THEN 1 END) * 100.0 / COUNT(*), 2
    )
  ) INTO result
  FROM donations;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ✅ FINAL VERIFICATION
-- ========================================

-- Display setup summary
SELECT 
  '✅ SIMPLIFIED SETUP COMPLETE!' as status,
  (SELECT COUNT(*) FROM donations) as sample_donations,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'receipts') as storage_buckets;

-- Display field structure
SELECT 
  '📊 TABLE FIELDS:' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'donations' 
AND column_name IN ('name', 'address', 'number', 'email', 'payment_status', 'type', 'amount', 'balance', 'total', 'receipt_url')
ORDER BY ordinal_position;

-- Display sample data
SELECT 
  '📝 SAMPLE DATA:' as info,
  id,
  name,
  LEFT(address, 20) || '...' as address,
  number,
  email,
  payment_status,
  type,
  amount,
  balance,
  total,
  CASE 
    WHEN receipt_url IS NOT NULL THEN '✅'
    ELSE '❌'
  END as receipt
FROM donations 
ORDER BY id;

-- Display statistics
SELECT get_donation_stats() as statistics;

-- ========================================
-- 📋 QUICK REFERENCE
-- ========================================

/*
🔗 TABLE STRUCTURE:
- id (Primary Key)
- name (Donor name)
- address (Full address)
- number (Phone number)
- email (Email address)
- payment_status (Pending/Completed/Failed/Cancelled)
- type (Cash/Online/Bank Transfer/Cheque/UPI)
- amount (Amount paid)
- balance (Remaining balance = total - amount)
- total (Total donation amount)
- receipt_url (PDF receipt URL)

📊 USEFUL QUERIES:
- SELECT * FROM donations_with_receipts;
- SELECT get_donation_stats();
- SELECT update_receipt_url(1, 'https://example.com/receipt.pdf');

🔗 API ENDPOINTS TO CREATE:
- POST /api/donations (Create new donation)
- GET /api/donations (Get all donations)
- GET /api/donations/:id (Get specific donation)
- PUT /api/donations/:id/receipt-url (Update receipt URL)

📁 STORAGE:
- Bucket: receipts
- Public access: Enabled
- File format: receipt_{id}_{timestamp}.pdf
*/
