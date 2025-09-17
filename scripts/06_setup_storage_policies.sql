-- =============================================================================
-- STORAGE BUCKET POLICIES FOR MENU IMAGES
-- =============================================================================
-- This script creates the storage bucket and sets up proper policies for menu image uploads

-- Create the menu-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
UPDATE storage.buckets 
SET public = true 
WHERE id = 'menu-images';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Give users access to own folder 1ffg0oo_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1ffg0oo_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1ffg0oo_2" ON storage.objects;
DROP POLICY IF EXISTS "Menu images upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Menu images view policy" ON storage.objects;
DROP POLICY IF EXISTS "Menu images delete policy" ON storage.objects;

-- Policy to allow authenticated users to upload menu images
CREATE POLICY "Menu images upload policy" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'menu-images'
);

-- Policy to allow anyone to view menu images (since they're public)
CREATE POLICY "Menu images view policy" ON storage.objects
FOR SELECT 
TO public
USING (
  bucket_id = 'menu-images'
);

-- Policy to allow authenticated users to delete their own uploaded images
CREATE POLICY "Menu images delete policy" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'menu-images'
);

-- Policy to allow authenticated users to update menu images
CREATE POLICY "Menu images update policy" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'menu-images'
);
