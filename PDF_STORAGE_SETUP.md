# PDF Receipt Storage Setup Guide

## Overview
This guide explains how to set up PDF receipt storage in Supabase for your donation management system.

## Current Status
- ✅ PDF Generation: Working (jsPDF + html2canvas)
- ✅ Database Integration: Working (receipt_url column)
- 🔄 Storage: **Needs Setup** (Supabase Storage)

## Setup Instructions

### Step 1: Create Supabase Storage Bucket
1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **New Bucket**
4. Name: `receipts`
5. Make it **Public** (so PDFs can be accessed via URL)

### Step 2: Run Storage Setup SQL
Execute the SQL commands in `supabase_storage_setup.sql`:

```sql
-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Set up storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
```

### Step 3: Test Storage
1. Submit a test donation
2. Check if PDF is uploaded to Storage > receipts bucket
3. Verify the URL is saved in donations table

## How It Works

### PDF Generation Flow
1. **User submits donation** → Form data processed
2. **PDF generated** → HTML template converted to PDF
3. **Upload to Supabase Storage** → PDF stored in 'receipts' bucket
4. **Get public URL** → Supabase provides permanent URL
5. **Update database** → URL saved in `receipt_url` column

### File Organization
```
Supabase Storage/
└── receipts/
    └── receipts/
        ├── receipt_John_Doe_1703123456789.pdf
        ├── receipt_Jane_Smith_1703123567890.pdf
        └── receipt_Bob_Johnson_1703123678901.pdf
```

### Database Schema
```sql
-- The donations table already has:
ALTER TABLE donations ADD COLUMN receipt_url TEXT;
```

## Benefits
- ✅ **Permanent Storage**: PDFs stored permanently in Supabase
- ✅ **Public URLs**: Direct links to PDF files
- ✅ **Organized**: All receipts in one place
- ✅ **Backup**: Automatic backup with Supabase
- ✅ **Export Ready**: URLs included in data exports

## Troubleshooting

### If Upload Fails
- Check Supabase Storage permissions
- Verify bucket exists and is public
- Check internet connection
- Falls back to local blob URL

### File Access Issues
- Ensure bucket is public
- Check RLS policies
- Verify file was uploaded successfully

## File Naming Convention
`receipt_[NAME]_[TIMESTAMP].pdf`
- Example: `receipt_John_Doe_1703123456789.pdf`
- Unique timestamp prevents conflicts
- Name helps identify donor

## Security Notes
- PDFs are stored in public bucket (accessible by URL)
- No sensitive payment details in PDFs
- Only donation receipt information included
- URLs can be shared safely

## Next Steps
1. Set up the storage bucket
2. Test with a donation
3. Verify PDF appears in storage
4. Check export functionality includes URLs
