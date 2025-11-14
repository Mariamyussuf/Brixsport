// Script to create media storage buckets
// Run this script after setting up your Supabase project

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function createMediaBuckets() {
  // Use the service role key for admin operations
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const buckets = [
    {
      name: 'avatars',
      config: {
        public: false,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: '5MB'
      },
      description: 'User profile avatars'
    },
    {
      name: 'team-logos',
      config: {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: '10MB'
      },
      description: 'Team logos and badges'
    },
    {
      name: 'match-media',
      config: {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*'],
        fileSizeLimit: '100MB'
      },
      description: 'Match photos and videos'
    },
    {
      name: 'documents',
      config: {
        public: false,
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        fileSizeLimit: '25MB'
      },
      description: 'Document uploads'
    }
  ];

  try {
    console.log('Creating media storage buckets...');
    
    for (const bucket of buckets) {
      console.log(`\nCreating bucket: ${bucket.name}`);
      
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket(bucket.name, bucket.config);

      if (error) {
        // Check if the bucket already exists
        if (error.message.includes('already exists')) {
          console.log(`Bucket ${bucket.name} already exists`);
        } else {
          console.error(`Failed to create bucket ${bucket.name}:`, error.message);
        }
      } else {
        console.log(`Bucket ${bucket.name} created successfully:`, data);
      }
    }

    // Set up RLS policies
    console.log('\nSetting up storage policies...');
    
    // Note: Storage policies are typically set up through the Supabase dashboard
    // or using the Supabase CLI. For now, we'll just log what policies should be set up.
    
    console.log(`
Storage policies to set up in the Supabase dashboard:

1. Avatars bucket policies:
   - Allow authenticated users to upload their own avatars:
     Name: "Users can upload avatars"
     For: INSERT
     To: authenticated
     Using: bucket_id = 'avatars' AND (SELECT auth.uid()) IS NOT NULL

   - Allow authenticated users to update their own avatars:
     Name: "Users can update avatars"
     For: UPDATE
     To: authenticated
     Using: bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())

   - Allow public read access to avatars:
     Name: "Public can read avatars"
     For: SELECT
     To: public
     Using: bucket_id = 'avatars'

2. Team logos bucket policies:
   - Allow admins to upload team logos:
     Name: "Admins can upload team logos"
     For: INSERT
     To: authenticated
     Using: bucket_id = 'team-logos' AND EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid() AND "User".role IN ('admin', 'super-admin'))

   - Allow admins to update team logos:
     Name: "Admins can update team logos"
     For: UPDATE
     To: authenticated
     Using: bucket_id = 'team-logos' AND EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid() AND "User".role IN ('admin', 'super-admin'))

   - Allow public read access to team logos:
     Name: "Public can read team logos"
     For: SELECT
     To: public
     Using: bucket_id = 'team-logos'

3. Match media bucket policies:
   - Allow authenticated users to upload match media:
     Name: "Users can upload match media"
     For: INSERT
     To: authenticated
     Using: bucket_id = 'match-media' AND (SELECT auth.uid()) IS NOT NULL

   - Allow admins to update match media:
     Name: "Admins can update match media"
     For: UPDATE
     To: authenticated
     Using: bucket_id = 'match-media' AND EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid() AND "User".role IN ('admin', 'super-admin'))

   - Allow public read access to match media:
     Name: "Public can read match media"
     For: SELECT
     To: public
     Using: bucket_id = 'match-media'

4. Documents bucket policies:
   - Allow authenticated users to upload documents:
     Name: "Users can upload documents"
     For: INSERT
     To: authenticated
     Using: bucket_id = 'documents' AND (SELECT auth.uid()) IS NOT NULL

   - Allow owners to update their documents:
     Name: "Users can update documents"
     For: UPDATE
     To: authenticated
     Using: bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid())

   - Allow owners to read their documents:
     Name: "Users can read documents"
     For: SELECT
     To: authenticated
     Using: bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid())
    `);

  } catch (error) {
    console.error('Error setting up media buckets:', error.message);
    process.exit(1);
  }
}

// Run the function to create the buckets
createMediaBuckets();