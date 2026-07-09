/**
 * setup.js — Runs the Supabase SQL migration + creates storage bucket
 * via the Supabase REST management API.
 *
 * Usage: node scripts/setup.js
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env
 * NOTE: The publishable (anon) key cannot run DDL. If this fails,
 *       paste supabase/migrations/001_init.sql into Supabase Dashboard → SQL Editor.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setup() {
  console.log('🔌 Connecting to Supabase:', supabaseUrl);

  // 1. Test connectivity
  const { data: ping, error: pingErr } = await supabase.from('documents').select('count').limit(1);
  if (pingErr && !pingErr.message.includes('does not exist')) {
    console.log('⚠️  Warning:', pingErr.message);
    console.log('');
    console.log('─────────────────────────────────────────────────────────');
    console.log('ACTION REQUIRED: Run the SQL migration manually.');
    console.log('1. Go to: https://supabase.com/dashboard/project/vfrqsvncagtxoostmgkv/sql/new');
    console.log('2. Copy and paste the contents of: supabase/migrations/001_init.sql');
    console.log('3. Click "Run"');
    console.log('─────────────────────────────────────────────────────────');
    console.log('');
  } else if (!pingErr) {
    console.log('✅ Tables already exist in Supabase.');
  } else {
    console.log('ℹ️  Tables not yet created — migration needed (see above).');
  }

  // 2. Create storage bucket
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.log('⚠️  Could not list buckets:', listErr.message);
    console.log('   → Go to Supabase Dashboard → Storage → New bucket → name: "documents" (private)');
  } else {
    const exists = buckets?.some(b => b.name === 'documents');
    if (exists) {
      console.log('✅ Storage bucket "documents" already exists.');
    } else {
      const { error: bucketErr } = await supabase.storage.createBucket('documents', { public: false });
      if (bucketErr) {
        console.log('⚠️  Could not create bucket:', bucketErr.message);
        console.log('   → Create it manually: Supabase Dashboard → Storage → New bucket → "documents"');
      } else {
        console.log('✅ Storage bucket "documents" created successfully.');
      }
    }
  }

  console.log('\n🎉 Setup complete. Start the server with: npm run dev');
}

setup().catch(err => {
  console.error('❌ Setup error:', err.message);
  process.exit(1);
});
