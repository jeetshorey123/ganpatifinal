-- Supabase Storage Setup for PDF Receipts
-- Run this SQL in your Supabase SQL Editor

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Set up storage policies for receipts bucket
-- Allow public access to read files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');

-- Allow authenticated users to insert files
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates" ON storage.objects FOR UPDATE 
USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE 
USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Alternative: Allow public uploads (if you want anonymous users to upload)
-- CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT 
-- WITH CHECK (bucket_id = 'receipts');

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'receipts';
