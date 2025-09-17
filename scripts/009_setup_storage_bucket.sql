-- =============================================================================
-- STORAGE BUCKET SETUP FOR MENU IMAGES
-- =============================================================================

-- Create the menu-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the menu-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload menu images" ON storage.objects
    FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'menu-images');

-- Allow authenticated users to view images
CREATE POLICY "Anyone can view menu images" ON storage.objects
    FOR SELECT 
    TO public 
    USING (bucket_id = 'menu-images');

-- Allow authenticated users to update/replace images
CREATE POLICY "Authenticated users can update menu images" ON storage.objects
    FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'menu-images')
    WITH CHECK (bucket_id = 'menu-images');

-- Allow authenticated users to delete images (for cleanup)
CREATE POLICY "Authenticated users can delete menu images" ON storage.objects
    FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'menu-images');

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify the bucket was created
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'menu-images';
