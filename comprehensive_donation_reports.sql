-- Comprehensive Donation Report with Building Statistics and Individual Donor Details
-- Updated with PDF Receipt Links and Email Support

-- 1. Building Summary Statistics with PDF Receipt Stats
SELECT 
  building AS "Building",
  COUNT(*) AS "Total Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Collected (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed Donations",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending Donations",
  ROUND(SUM(CASE WHEN payment_status = 'Pending' THEN (total_amount - amount_paid) ELSE 0 END), 2) AS "Pending Amount (₹)",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "Receipts Generated",
  ROUND((COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 1) AS "Receipt Generation %"
FROM donations
GROUP BY building
ORDER BY building;

-- 2. Detailed Donor Information with Building and PDF Links
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  payment_method AS "Payment Method",
  payment_status AS "Status",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Balance (₹)",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
ORDER BY building, wing, CAST(flat AS INTEGER), created_at DESC;

-- 3. Building-wise Detailed Report (Combined View with PDF Links)
SELECT 
  d.building AS "Building",
  d.wing AS "Wing", 
  d.flat AS "Flat No",
  d.name AS "Donor Name",
  d.phone AS "Phone Number",
  d.email AS "Email",
  d.resident_type AS "Resident Type",
  d.payment_status AS "Status",
  ROUND(d.total_amount, 2) AS "Total (₹)",
  ROUND(d.amount_paid, 2) AS "Paid (₹)",
  ROUND(COALESCE(d.balance_amount, (d.total_amount - d.amount_paid)), 2) AS "Balance (₹)",
  TO_CHAR(d.created_at, 'DD/MM/YYYY') AS "Date",
  -- Building statistics as additional columns
  bs.total_donations AS "Building Total Donations",
  ROUND(bs.total_collected, 2) AS "Building Total Collected (₹)",
  bs.completed_donations AS "Building Completed",
  bs.pending_donations AS "Building Pending",
  ROUND(bs.pending_amount, 2) AS "Building Pending Amount (₹)",
  COALESCE(d.receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations d
JOIN (
  SELECT 
    building,
    COUNT(*) as total_donations,
    SUM(amount_paid) as total_collected,
    SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) as completed_donations,
    SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) as pending_donations,
    SUM(CASE WHEN payment_status = 'Pending' THEN COALESCE(balance_amount, (total_amount - amount_paid)) ELSE 0 END) as pending_amount
  FROM donations
  GROUP BY building
) bs ON d.building = bs.building
ORDER BY d.building, d.wing, CAST(d.flat AS INTEGER);

-- 4. Specific Building Filter (Sankalp 1) with PDF Links
SELECT 
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  payment_status AS "Status",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Balance Amount (₹)",
  payment_method AS "Payment Method",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
WHERE building = 'Sankalp 1'
ORDER BY wing, CAST(flat AS INTEGER);

-- 5. Specific Building Filter (Sankalp 2) with PDF Links
SELECT 
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  payment_status AS "Status",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Balance Amount (₹)",
  payment_method AS "Payment Method",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
WHERE building = 'Sankalp 2'
ORDER BY wing, CAST(flat AS INTEGER);

-- 6. Summary Totals Across All Buildings with PDF Stats
SELECT 
  'OVERALL TOTAL' AS "Summary",
  COUNT(*) AS "Total Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Collected (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed Donations",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending Donations",
  ROUND(SUM(CASE WHEN payment_status = 'Pending' THEN COALESCE(balance_amount, (total_amount - amount_paid)) ELSE 0 END), 2) AS "Pending Amount (₹)",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts Generated",
  ROUND((COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 1) AS "Receipt Generation %"
FROM donations;

-- 7. Wing-wise breakdown for each building with PDF Links
SELECT 
  building AS "Building",
  wing AS "Wing",
  COUNT(*) AS "Donations in Wing",
  ROUND(SUM(amount_paid), 2) AS "Wing Collection (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts"
FROM donations
GROUP BY building, wing
ORDER BY building, wing;

-- 8. Recent Donations (Last 10) with PDF Links
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat",
  name AS "Name",
  phone AS "Phone",
  email AS "Email",
  resident_type AS "Type",
  ROUND(amount_paid, 2) AS "Amount (₹)",
  payment_status AS "Status",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
ORDER BY created_at DESC
LIMIT 10;

-- 9. Payment Method Analysis with PDF Links
SELECT 
  payment_method AS "Payment Method",
  COUNT(*) AS "Total Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Amount (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts",
  ROUND(AVG(amount_paid), 2) AS "Average Amount (₹)"
FROM donations
GROUP BY payment_method
ORDER BY "Total Amount (₹)" DESC;

-- 10. Pending Donations Report with PDF Links
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Pending Amount (₹)",
  payment_method AS "Payment Method",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
WHERE payment_status = 'Pending' AND COALESCE(balance_amount, (total_amount - amount_paid)) > 0
ORDER BY "Pending Amount (₹)" DESC;

-- 11. Completed Donations Report with PDF Links
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  ROUND(total_amount, 2) AS "Amount (₹)",
  payment_method AS "Payment Method",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
WHERE payment_status = 'Completed'
ORDER BY created_at DESC;

-- 12. Donors Without PDF Receipts (For Follow-up)
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  payment_status AS "Status",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  'PDF NOT GENERATED' AS "PDF Receipt Status"
FROM donations
WHERE receipt_url IS NULL
ORDER BY created_at DESC;

-- 13. Google Sheets Export Format (All Data with PDF Links)
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  payment_method AS "Payment Method",
  payment_status AS "Status",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Balance (₹)",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt"
FROM donations
ORDER BY building, wing, CAST(flat AS INTEGER), created_at DESC;

-- 14. Daily Collection Report with PDF Links
SELECT 
  DATE(created_at) AS "Date",
  COUNT(*) AS "Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Collection (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts"
FROM donations
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- 15. Receipt URL Statistics
SELECT 
  'PDF Receipt Statistics' AS "Report Type",
  COUNT(*) AS "Total Donations",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts Generated",
  COUNT(CASE WHEN receipt_url IS NULL THEN 1 END) AS "PDF Receipts Missing",
  ROUND((COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 1) AS "Generation Success Rate %"
FROM donations;

-- 16. Most Used Report - Complete Donor List with PDF Links (For Admin Dashboard)
SELECT 
  ROW_NUMBER() OVER (ORDER BY created_at DESC) AS "Sr No",
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  payment_method AS "Payment Method",
  payment_status AS "Status",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Balance (₹)",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  CASE 
    WHEN receipt_url IS NOT NULL THEN receipt_url
    ELSE 'Not Generated'
  END AS "PDF Receipt Link"
FROM donations
ORDER BY created_at DESC;

-- 17. Building-wise Collection Summary for Quick Review
SELECT 
  building AS "Building",
  COUNT(*) AS "Total Donors",
  ROUND(SUM(amount_paid), 2) AS "Total Collection (₹)",
  COUNT(CASE WHEN payment_status = 'Completed' THEN 1 END) AS "Full Payments",
  COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) AS "Partial Payments",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts",
  ROUND((COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 1) AS "Receipt %"
FROM donations
GROUP BY building
ORDER BY "Total Collection (₹)" DESC;

-- 18. Export for Google Sheets (Formatted for easy copy-paste)
SELECT 
  d.building,
  d.wing,
  d.flat,
  d.name,
  d.phone,
  d.email,
  d.resident_type,
  d.payment_method,
  d.payment_status,
  d.total_amount,
  d.amount_paid,
  COALESCE(d.balance_amount, (d.total_amount - d.amount_paid)) AS balance,
  TO_CHAR(d.created_at, 'DD/MM/YYYY HH24:MI') AS date_time,
  COALESCE(d.receipt_url, 'Not Generated') AS pdf_receipt
FROM donations d
ORDER BY d.building, d.wing, CAST(d.flat AS INTEGER), d.created_at DESC;

-- 19. Monthly Collection Report
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') AS "Month",
  COUNT(*) AS "Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Collection (₹)",
  COUNT(CASE WHEN payment_status = 'Completed' THEN 1 END) AS "Completed",
  COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) AS "Pending",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts"
FROM donations
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY TO_CHAR(created_at, 'YYYY-MM') DESC;

-- 20. Top Donors Report
SELECT 
  name AS "Donor Name",
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  ROUND(amount_paid, 2) AS "Amount Donated (₹)",
  payment_status AS "Status",
  TO_CHAR(created_at, 'DD/MM/YYYY') AS "Date",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
WHERE amount_paid > 0
ORDER BY amount_paid DESC
LIMIT 20;

-- 21. Resident Type Analysis
SELECT 
  resident_type AS "Resident Type",
  COUNT(*) AS "Total Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Amount (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts",
  ROUND(AVG(amount_paid), 2) AS "Average Amount (₹)"
FROM donations
GROUP BY resident_type
ORDER BY "Total Amount (₹)" DESC;

-- 22. Email Contact List for Follow-up
SELECT 
  name AS "Donor Name",
  email AS "Email",
  phone AS "Phone Number",
  resident_type AS "Resident Type",
  CASE 
    WHEN resident_type = 'Sankalp Resident' THEN CONCAT(wing, '-', flat, ', ', building)
    ELSE 'Outsider'
  END AS "Address",
  ROUND(amount_paid, 2) AS "Amount Donated (₹)",
  payment_status AS "Status",
  TO_CHAR(created_at, 'DD/MM/YYYY') AS "Date"
FROM donations
WHERE email IS NOT NULL AND email != 'noemail@example.com'
ORDER BY created_at DESC;

-- 1. Building Summary Statistics with PDF Receipt Stats
SELECT 
  building AS "Building",
  COUNT(*) AS "Total Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Collected (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed Donations",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending Donations",
  ROUND(SUM(CASE WHEN payment_status = 'Pending' THEN (total_amount - amount_paid) ELSE 0 END), 2) AS "Pending Amount (₹)",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "Receipts Generated",
  ROUND((COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 1) AS "Receipt Generation %"
FROM donations
GROUP BY building
ORDER BY building;

-- 2. Detailed Donor Information with Building and PDF Links
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  payment_method AS "Payment Method",
  payment_status AS "Status",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Balance (₹)",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
ORDER BY building, wing, CAST(flat AS INTEGER), created_at DESC;

-- 3. Building-wise Detailed Report (Combined View with PDF Links)
SELECT 
  d.building AS "Building",
  d.wing AS "Wing", 
  d.flat AS "Flat No",
  d.name AS "Donor Name",
  d.phone AS "Phone Number",
  d.payment_status AS "Status",
  ROUND(d.total_amount, 2) AS "Total (₹)",
  ROUND(d.amount_paid, 2) AS "Paid (₹)",
  ROUND(COALESCE(d.balance_amount, (d.total_amount - d.amount_paid)), 2) AS "Balance (₹)",
  TO_CHAR(d.created_at, 'DD/MM/YYYY') AS "Date",
  -- Building statistics as additional columns
  bs.total_donations AS "Building Total Donations",
  ROUND(bs.total_collected, 2) AS "Building Total Collected (₹)",
  bs.completed_donations AS "Building Completed",
  bs.pending_donations AS "Building Pending",
  ROUND(bs.pending_amount, 2) AS "Building Pending Amount (₹)",
  COALESCE(d.receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations d
JOIN (
  SELECT 
    building,
    COUNT(*) as total_donations,
    SUM(amount_paid) as total_collected,
    SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) as completed_donations,
    SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) as pending_donations,
    SUM(CASE WHEN payment_status = 'Pending' THEN COALESCE(balance_amount, (total_amount - amount_paid)) ELSE 0 END) as pending_amount
  FROM donations
  GROUP BY building
) bs ON d.building = bs.building
ORDER BY d.building, d.wing, CAST(d.flat AS INTEGER);

-- 4. Specific Building Filter (Sankalp 1) with PDF Links
SELECT 
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  payment_status AS "Status",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Balance Amount (₹)",
  payment_method AS "Payment Method",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
WHERE building = 'Sankalp 1'
ORDER BY wing, CAST(flat AS INTEGER);

-- 5. Specific Building Filter (Sankalp 2) with PDF Links
SELECT 
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  payment_status AS "Status",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Balance Amount (₹)",
  payment_method AS "Payment Method",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
WHERE building = 'Sankalp 2'
ORDER BY wing, CAST(flat AS INTEGER);

-- 6. Summary Totals Across All Buildings with PDF Stats
SELECT 
  'OVERALL TOTAL' AS "Summary",
  COUNT(*) AS "Total Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Collected (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed Donations",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending Donations",
  ROUND(SUM(CASE WHEN payment_status = 'Pending' THEN COALESCE(balance_amount, (total_amount - amount_paid)) ELSE 0 END), 2) AS "Pending Amount (₹)",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts Generated",
  ROUND((COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 1) AS "Receipt Generation %"
FROM donations;

-- 7. Wing-wise breakdown for each building with PDF Links
SELECT 
  building AS "Building",
  wing AS "Wing",
  COUNT(*) AS "Donations in Wing",
  ROUND(SUM(amount_paid), 2) AS "Wing Collection (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts"
FROM donations
GROUP BY building, wing
ORDER BY building, wing;

-- 8. Recent Donations (Last 10) with PDF Links
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat",
  name AS "Name",
  phone AS "Phone",
  ROUND(amount_paid, 2) AS "Amount (₹)",
  payment_status AS "Status",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
ORDER BY created_at DESC
LIMIT 10;

-- 9. Payment Method Analysis with PDF Links
SELECT 
  payment_method AS "Payment Method",
  COUNT(*) AS "Total Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Amount (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts",
  ROUND(AVG(amount_paid), 2) AS "Average Amount (₹)"
FROM donations
GROUP BY payment_method
ORDER BY "Total Amount (₹)" DESC;

-- 10. Pending Donations Report with PDF Links
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Pending Amount (₹)",
  payment_method AS "Payment Method",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
WHERE payment_status = 'Pending' AND COALESCE(balance_amount, (total_amount - amount_paid)) > 0
ORDER BY "Pending Amount (₹)" DESC;

-- 11. Completed Donations Report with PDF Links
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  ROUND(total_amount, 2) AS "Amount (₹)",
  payment_method AS "Payment Method",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
WHERE payment_status = 'Completed'
ORDER BY created_at DESC;

-- 12. Donors Without PDF Receipts (For Follow-up)
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  payment_status AS "Status",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  'PDF NOT GENERATED' AS "PDF Receipt Status"
FROM donations
WHERE receipt_url IS NULL
ORDER BY created_at DESC;

-- 13. Google Sheets Export Format (All Data with PDF Links)
SELECT 
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  payment_method AS "Payment Method",
  payment_status AS "Status",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Balance (₹)",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt"
FROM donations
ORDER BY building, wing, CAST(flat AS INTEGER), created_at DESC;

-- 14. Daily Collection Report with PDF Links
SELECT 
  DATE(created_at) AS "Date",
  COUNT(*) AS "Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Collection (₹)",
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) AS "Completed",
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) AS "Pending",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts"
FROM donations
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- 15. Receipt URL Statistics
SELECT 
  'PDF Receipt Statistics' AS "Report Type",
  COUNT(*) AS "Total Donations",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts Generated",
  COUNT(CASE WHEN receipt_url IS NULL THEN 1 END) AS "PDF Receipts Missing",
  ROUND((COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 1) AS "Generation Success Rate %"
FROM donations;

-- 16. Most Used Report - Complete Donor List with PDF Links (For Admin Dashboard)
SELECT 
  ROW_NUMBER() OVER (ORDER BY created_at DESC) AS "Sr No",
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  name AS "Donor Name",
  phone AS "Phone Number",
  email AS "Email",
  resident_type AS "Resident Type",
  payment_method AS "Payment Method",
  payment_status AS "Status",
  ROUND(total_amount, 2) AS "Total Amount (₹)",
  ROUND(amount_paid, 2) AS "Amount Paid (₹)",
  ROUND(COALESCE(balance_amount, (total_amount - amount_paid)), 2) AS "Balance (₹)",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "Date & Time",
  CASE 
    WHEN receipt_url IS NOT NULL THEN receipt_url
    ELSE 'Not Generated'
  END AS "PDF Receipt Link"
FROM donations
ORDER BY created_at DESC;

-- 17. Building-wise Collection Summary for Quick Review
SELECT 
  building AS "Building",
  COUNT(*) AS "Total Donors",
  ROUND(SUM(amount_paid), 2) AS "Total Collection (₹)",
  COUNT(CASE WHEN payment_status = 'Completed' THEN 1 END) AS "Full Payments",
  COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) AS "Partial Payments",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts",
  ROUND((COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 1) AS "Receipt %"
FROM donations
GROUP BY building
ORDER BY "Total Collection (₹)" DESC;

-- 18. Export for Google Sheets (Formatted for easy copy-paste)
SELECT 
  d.building,
  d.wing,
  d.flat,
  d.name,
  d.phone,
  d.email,
  d.resident_type,
  d.payment_method,
  d.payment_status,
  d.total_amount,
  d.amount_paid,
  COALESCE(d.balance_amount, (d.total_amount - d.amount_paid)) AS balance,
  TO_CHAR(d.created_at, 'DD/MM/YYYY HH24:MI') AS date_time,
  COALESCE(d.receipt_url, 'Not Generated') AS pdf_receipt
FROM donations d
ORDER BY d.building, d.wing, CAST(d.flat AS INTEGER), d.created_at DESC;

-- 19. Monthly Collection Report
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') AS "Month",
  COUNT(*) AS "Donations",
  ROUND(SUM(amount_paid), 2) AS "Total Collection (₹)",
  COUNT(CASE WHEN payment_status = 'Completed' THEN 1 END) AS "Completed",
  COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) AS "Pending",
  COUNT(CASE WHEN receipt_url IS NOT NULL THEN 1 END) AS "PDF Receipts"
FROM donations
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY TO_CHAR(created_at, 'YYYY-MM') DESC;

-- 20. Top Donors Report
SELECT 
  name AS "Donor Name",
  building AS "Building",
  wing AS "Wing",
  flat AS "Flat No",
  phone AS "Phone Number",
  ROUND(amount_paid, 2) AS "Amount Donated (₹)",
  payment_status AS "Status",
  TO_CHAR(created_at, 'DD/MM/YYYY') AS "Date",
  COALESCE(receipt_url, 'Not Generated') AS "PDF Receipt Link"
FROM donations
WHERE amount_paid > 0
ORDER BY amount_paid DESC
LIMIT 20;
