#!/usr/bin/env node

/**
 * Supabase Storage Setup Script
 * 
 * This script creates required storage buckets for the application.
 * Run this once during initial setup: node scripts/setup-storage.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

const REQUIRED_BUCKETS = [
  {
    id: 'avatars',
    name: 'User Avatars',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  // Add other buckets as needed
];

async function setupStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase environment variables');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
    process.exit(1);
  }

  console.log('🚀 Starting Supabase Storage setup...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check existing buckets
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    process.exit(1);
  }

  const existingBucketIds = new Set(existingBuckets?.map(b => b.id) || []);

  // Create missing buckets
  for (const bucketConfig of REQUIRED_BUCKETS) {
    if (existingBucketIds.has(bucketConfig.id)) {
      console.log(`✅ Bucket "${bucketConfig.id}" already exists`);
      continue;
    }

    console.log(`📦 Creating bucket "${bucketConfig.id}"...`);

    const { error } = await supabase.storage.createBucket(bucketConfig.id, {
      public: bucketConfig.public,
      fileSizeLimit: bucketConfig.fileSizeLimit,
      allowedMimeTypes: bucketConfig.allowedMimeTypes,
    });

    if (error) {
      console.error(`❌ Failed to create bucket "${bucketConfig.id}":`, error.message);
      console.error('   This might be due to insufficient permissions.');
      console.error('   You may need to create this bucket manually in the Supabase Dashboard.');
    } else {
      console.log(`✅ Successfully created bucket "${bucketConfig.id}"`);
    }
  }

  console.log('\n🎉 Storage setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Verify buckets in Supabase Dashboard: Storage section');
  console.log('2. Configure RLS policies if needed for private buckets');
  console.log('3. Test file uploads in your application\n');
}

// Run setup
setupStorage().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
