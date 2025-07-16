-- Add receipt_url column to existing donations table
ALTER TABLE donations ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(500);

-- Add comment to the new column
COMMENT ON COLUMN donations.receipt_url IS 'URL to the PDF receipt file';

-- Create index for faster queries on receipt_url
CREATE INDEX IF NOT EXISTS idx_donations_receipt_url ON donations(receipt_url);

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns 
WHERE table_name = 'donations' 
AND column_name = 'receipt_url';
