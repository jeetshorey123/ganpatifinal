# Email and Resident Type Setup Guide

## Overview
This guide explains the new email and resident type functionality added to the donation system. The system now supports both Sankalp residents and outsiders with different form flows.

## Database Changes

### 1. Run the Database Update Script
Execute the following SQL script in your Supabase SQL editor:

```sql
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
```

## New Features

### 1. Email Field
- **Required field** for all donations
- Stored in database and included in all reports
- Appears in PDF receipts and export data
- Used for donor contact information

### 2. Resident Type Selection
- **Two options:**
  - **Sankalp Resident**: Requires wing, flat, and building details
  - **Outsider**: No address fields required

### 3. Conditional Form Logic
- **For Sankalp Residents:**
  - Shows wing dropdown (A, B)
  - Shows flat number input field
  - Shows building dropdown (Sankalp 1, Sankalp 2)
  - All address fields are required

- **For Outsiders:**
  - Address fields are hidden
  - No wing, flat, or building required
  - Form is shorter and simpler

### 4. Updated Reports
All SQL reports now include:
- Email address column
- Resident type column
- Proper handling of nullable address fields for outsiders

## Form Flow

### Step 1: Basic Information
1. Full Name (required)
2. Phone Number (required)
3. **Email Address (required)** ← NEW
4. **Resident Type (required)** ← NEW

### Step 2: Address (Conditional)
**If Sankalp Resident selected:**
- Wing (A or B)
- Flat Number
- Building (Sankalp 1 or 2)

**If Outsider selected:**
- No additional address fields

### Step 3: Payment Details
- Payment Method (Cash or UPI)
- Payment Status (Full Payment or Partial Payment)
- Total Amount
- Amount Paid

## PDF Receipt Updates

### Enhanced Receipt Information
- **Email address** included in donor details
- **Resident type** clearly displayed
- **Address handling:**
  - Sankalp Residents: Shows "Wing-Flat, Building"
  - Outsiders: Shows "Outsider"

### Fixed Issues
- **Total amount undefined** issue resolved
- Proper field name handling for both database and form data
- Accurate balance calculations

## Export Data Updates

### New Export Fields
All export formats now include:
- Email address
- Resident type
- Proper handling of nullable address fields

### Enhanced Filters
- **Partial Payments Filter** shows email and resident type
- **Building Filter** works correctly with nullable fields
- **Export formats** handle both resident types properly

## SQL Reports Enhancement

### New Reports Added
- **Report 21**: Resident Type Analysis
- **Report 22**: Email Contact List for Follow-up

### Updated Existing Reports
All 20 existing reports now include:
- Email address in appropriate columns
- Resident type information
- Proper handling of nullable address fields

## WhatsApp Message Updates

### Enhanced Receipt Messages
- **Email included** in donor details
- **Address format:**
  - Sankalp Residents: "Wing-Flat, Building"
  - Outsiders: "Outsider"

## UPI Payment Integration

### Enhanced Validation
- **Email required** for UPI payments
- **Resident type required** for UPI payments
- **Address validation:**
  - Sankalp Residents: Wing, flat, building required
  - Outsiders: No address validation needed

## Migration Notes

### Existing Data
- All existing records will have:
  - Email set to 'noemail@example.com'
  - Resident type set to 'Sankalp Resident'
  - Address fields remain unchanged

### Update Process
1. Run the database update script
2. Deploy updated application code
3. Test with both resident types
4. Verify PDF generation works correctly
5. Check all export formats include new fields

## Testing Checklist

### Form Testing
- [ ] Email field is required
- [ ] Resident type selection works
- [ ] Address fields show/hide correctly
- [ ] Form validation works for both types
- [ ] UPI payment works with new fields

### PDF Testing
- [ ] Email appears in PDF receipts
- [ ] Resident type is shown correctly
- [ ] Address displays properly for both types
- [ ] Total amount shows correctly (not undefined)
- [ ] Balance calculations are accurate

### Export Testing
- [ ] Email column appears in all exports
- [ ] Resident type column appears in all exports
- [ ] Partial payments filter includes new fields
- [ ] Building filter works with nullable fields

### Database Testing
- [ ] New fields are created
- [ ] Existing data is migrated
- [ ] Indexes are created
- [ ] Views are updated

## Support

If you encounter any issues:
1. Check database schema is updated
2. Verify all files are deployed
3. Clear browser cache
4. Test with different resident types
5. Check console for JavaScript errors

The system now provides a comprehensive donation management solution with proper email tracking and flexible resident type handling!
