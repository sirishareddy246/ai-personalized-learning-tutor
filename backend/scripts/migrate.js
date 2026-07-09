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

const migrationsDir = path.join(__dirname, '..', '..', 'supabase', 'migrations');

async function migrate() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  try {
    console.log('🔌 Connecting to Supabase Postgres...');
    await client.connect();
    console.log('✅ Connected. Fetching migrations...');

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`✅ Completed migration: ${file}`);
    }
    console.log('🎉 All migrations complete! Database is up to date.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
