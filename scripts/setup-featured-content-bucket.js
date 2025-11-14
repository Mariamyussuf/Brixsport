// Script to create the featured content storage bucket
// Run this script after setting up your Supabase project

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function createFeaturedContentBucket() {
  // Use the service role key for admin operations
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('Creating featured content storage bucket...');
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('featured-content', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: '5MB'
    });

    if (error) {
      // Check if the bucket already exists
      if (error.message.includes('already exists')) {
        console.log('Featured content bucket already exists');
      } else {
        throw new Error(`Failed to create bucket: ${error.message}`);
      }
    } else {
      console.log('Featured content bucket created successfully:', data);
    }

    // Set up RLS policies
    console.log('Setting up storage policies...');
    
    // Note: Storage policies are typically set up through the Supabase dashboard
    // or using the Supabase CLI. For now, we'll just log what policies should be set up.
    
    console.log(`
Storage policies to set up in the Supabase dashboard:

1. Allow authenticated admins to upload files:
   - Name: "Admins can upload featured content images"
   - For: INSERT
   - To: authenticated
   - Using: bucket_id = 'featured-content' AND EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid() AND "User".role IN ('admin', 'super-admin'))

2. Allow authenticated admins to update files:
   - Name: "Admins can update featured content images"
   - For: UPDATE
   - To: authenticated
   - Using: bucket_id = 'featured-content' AND EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid() AND "User".role IN ('admin', 'super-admin'))

3. Allow authenticated admins to delete files:
   - Name: "Admins can delete featured content images"
   - For: DELETE
   - To: authenticated
   - Using: bucket_id = 'featured-content' AND EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid() AND "User".role IN ('admin', 'super-admin'))

4. Allow public read access to featured content images:
   - Name: "Public can read featured content images"
   - For: SELECT
   - To: public
   - Using: bucket_id = 'featured-content'
    `);

  } catch (error) {
    console.error('Error setting up featured content bucket:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createFeaturedContentBucket()
    .then(() => {
      console.log('Featured content bucket setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to set up featured content bucket:', error);
      process.exit(1);
    });
}

module.exports = { createFeaturedContentBucket };