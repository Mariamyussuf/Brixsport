-- Create storage bucket for featured content images
-- This SQL script should be run in the Supabase SQL editor to create the storage bucket

-- Note: Storage buckets are managed through the Supabase Storage API, not through SQL directly.
-- However, we can set up the necessary policies and configurations here.

-- First, we need to create the bucket programmatically using the Supabase client.
-- This is typically done in an initialization script or setup process.

-- For reference, here's how you would create the bucket programmatically in JavaScript:
/*
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createFeaturedContentBucket() {
  const { data, error } = await supabaseAdmin.storage.createBucket('featured-content', {
    public: true,
    allowedMimeTypes: ['image/*'],
    fileSizeLimit: '5MB'
  });

  if (error) {
    console.error('Error creating featured content bucket:', error);
  } else {
    console.log('Featured content bucket created successfully:', data);
  }
}

// Run the function to create the bucket
createFeaturedContentBucket();
*/

-- Storage policies for the featured-content bucket
-- These policies should be set up after creating the bucket

-- Allow authenticated admins to upload files
-- CREATE POLICY "Admins can upload featured content images"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- USING (
--   bucket_id = 'featured-content'
--   AND EXISTS (
--     SELECT 1
--     FROM "User"
--     WHERE "User".id = auth.uid()
--     AND "User".role IN ('admin', 'super-admin')
--   )
-- );

-- Allow authenticated admins to update files
-- CREATE POLICY "Admins can update featured content images"
-- ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'featured-content'
--   AND EXISTS (
--     SELECT 1
--     FROM "User"
--     WHERE "User".id = auth.uid()
--     AND "User".role IN ('admin', 'super-admin')
--   )
-- );

-- Allow authenticated admins to delete files
-- CREATE POLICY "Admins can delete featured content images"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'featured-content'
--   AND EXISTS (
--     SELECT 1
--     FROM "User"
--     WHERE "User".id = auth.uid()
--     AND "User".role IN ('admin', 'super-admin')
--   )
-- );

-- Allow public read access to featured content images
-- CREATE POLICY "Public can read featured content images"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'featured-content');

-- Comments for documentation
-- COMMENT ON BUCKET featured-content IS 'Storage bucket for featured content images';