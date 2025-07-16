-- 🔄 UPDATE RECEIPT DELIVERY PREFERENCES
-- Add 'Download' option to receipt_delivery_preference column

-- Update the check constraint to include 'Download' option
ALTER TABLE donations 
DROP CONSTRAINT IF EXISTS donations_receipt_delivery_preference_check;

ALTER TABLE donations 
ADD CONSTRAINT donations_receipt_delivery_preference_check 
CHECK (receipt_delivery_preference IN ('WhatsApp', 'Email', 'Download', 'Both'));

-- Update any existing 'Both' entries if needed (optional)
-- UPDATE donations SET receipt_delivery_preference = 'WhatsApp' WHERE receipt_delivery_preference = 'Both';

-- Verify the constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'donations_receipt_delivery_preference_check';

-- Show sample data
SELECT id, name, receipt_delivery_preference, receipt_url 
FROM donations 
ORDER BY created_at DESC 
LIMIT 5;
