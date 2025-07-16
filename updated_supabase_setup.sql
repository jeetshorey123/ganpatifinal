-- ========================================
-- UPDATE DONATIONS TABLE WITH RECEIPT PREFERENCE
-- ========================================

ALTER TABLE donations
ALTER COLUMN receipt_delivery_preference TYPE VARCHAR(20),
ALTER COLUMN receipt_delivery_preference SET DEFAULT 'WhatsApp',
ADD CONSTRAINT receipt_delivery_preference_check 
CHECK (receipt_delivery_preference IN ('WhatsApp', 'Email', 'Download'));
