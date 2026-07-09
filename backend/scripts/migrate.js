/**
 * migrate.js — Runs the Supabase SQL migration via direct Postgres connection.
 * Usage: node migrate.js
 */
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL || DB_URL.includes('[YOUR-PASSWORD]')) {
  console.error('❌  DATABASE_URL not set or still has placeholder password in backend/.env');
  process.exit(1);
}

const sql = fs.readFileSync(
  path.join(__dirname, '..', '..', 'supabase', 'migrations', '001_init.sql'),
  'utf8'
);

async function migrate() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  try {
    console.log('🔌 Connecting to Supabase Postgres...');
    await client.connect();
    console.log('✅ Connected. Running migration...');
    await client.query(sql);
    console.log('✅ Migration complete! Tables + pgvector enabled.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
