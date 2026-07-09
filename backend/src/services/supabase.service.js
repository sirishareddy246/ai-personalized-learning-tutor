global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');

let _client = null;

function getClient() {
  if (_client) return _client;

  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey;

  if (!url || url.includes('your_supabase') || !url.startsWith('http')) {
    throw new Error(
      'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env'
    );
  }
  if (!key || key.includes('your_supabase')) {
    throw new Error(
      'Supabase service role key is missing. Please set SUPABASE_SERVICE_ROLE_KEY in backend/.env'
    );
  }

  _client = createClient(url, key);
  return _client;
}

// Proxy: every property access goes through the lazy getter
const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return getClient()[prop];
    },
  }
);

module.exports = supabase;
