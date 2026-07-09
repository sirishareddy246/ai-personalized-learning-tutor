const { createClient } = require('@supabase/supabase-js');

// Service-role client — backend only. Never send this key to the frontend.
// Bypasses RLS, so every query in quiz.service.js must manually scope by user_id/session ownership.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase };
