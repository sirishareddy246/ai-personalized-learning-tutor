require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  grokApiKey: process.env.GROK_API_KEY,
  grokBaseUrl: 'https://api.x.ai/v1',
  grokModel: 'grok-3',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
  chunkSize: 500,
  chunkOverlap: 50,
  matchThreshold: 0.3,
  matchCount: 5,
};
