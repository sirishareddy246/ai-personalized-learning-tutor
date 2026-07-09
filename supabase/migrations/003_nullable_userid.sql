-- Drop the NOT NULL constraint from user_id to allow guest/dev sessions
ALTER TABLE adaptive_quiz_sessions ALTER COLUMN user_id DROP NOT NULL;
