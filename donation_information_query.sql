-- Donation Information Query with Receipt Delivery Details
-- This query retrieves comprehensive donation data including receipt delivery preferences

SELECT 
  id,
  name,
  phone as number,
  CASE 
    WHEN wing IS NOT NULL AND flat IS NOT NULL AND building IS NOT NULL THEN 
      CONCAT(flat, ', ', wing, ' Wing, ', building)
    WHEN wing IS NOT NULL AND flat IS NOT NULL THEN 
      CONCAT(flat, ', ', wing, ' Wing')
    WHEN building IS NOT NULL THEN 
      building
    ELSE 
      'Address not provided'
  END AS address,
  payment_status,
  payment_method,
  total_amount,
  amount_paid,
  balance_amount,
  created_at as timestamp,
  receipt_url,
  receipt_delivery_preference,
  CASE 
    WHEN receipt_delivery_preference = 'WhatsApp' THEN '📱 Receipt on WhatsApp'
    WHEN receipt_delivery_preference = 'Email' THEN '📧 Receipt via Email'
    WHEN receipt_delivery_preference = 'Download' THEN '⬇️ Receipt Downloaded'
    WHEN receipt_delivery_preference = 'Both' THEN '📱📧 Receipt on WhatsApp & Email'
    ELSE 'No delivery preference specified'
  END AS receipt_delivery_method,
  CASE 
    WHEN receipt_url IS NOT NULL THEN '✅ Generated'
    WHEN payment_status = 'Completed' THEN '⏳ Pending'
    ELSE '❌ Not Required Yet'
  END AS receipt_status
FROM donations
ORDER BY created_at DESC;

-- For filtering donations with specific receipt delivery preferences:
-- Add WHERE clause like:
-- WHERE receipt_delivery_preference = 'WhatsApp'
-- WHERE receipt_delivery_preference = 'Email'
-- WHERE receipt_delivery_preference = 'Download'

-- For filtering based on receipt availability:
-- WHERE receipt_url IS NOT NULL (receipts already generated)
-- WHERE receipt_url IS NULL AND payment_status = 'Completed' (receipts pending generation)

-- For searching by donor name, phone or address:
-- WHERE name ILIKE '%search_term%' OR phone ILIKE '%search_term%'

-- For a specific date range:
-- WHERE created_at BETWEEN '2025-01-01' AND '2025-12-31'

-- For retrieving only completed donations with their receipt status:
-- WHERE payment_status = 'Completed'
