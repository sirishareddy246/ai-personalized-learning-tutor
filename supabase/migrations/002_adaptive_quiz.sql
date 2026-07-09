-- ============================================================
-- 002_adaptive_quiz.sql — Adaptive Quiz Schema
-- ============================================================

-- 1. Create adaptive_quiz_questions table
create table if not exists adaptive_quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id) on delete cascade,
  chunk_id        uuid references chunks(id) on delete set null,
  level           text not null check (level in ('easy', 'medium', 'hard')),
  question        text not null,
  options         jsonb not null,           -- e.g. ["A) ...", "B) ...", "C) ...", "D) ..."]
  correct_answer  text not null,     -- e.g. "B"
  explanation     text,
  created_at      timestamptz default now()
);

create index if not exists idx_adaptive_quiz_questions_document_level
  on adaptive_quiz_questions (document_id, level);

-- 2. Create adaptive_quiz_sessions table
create table if not exists adaptive_quiz_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  document_id         uuid not null references documents(id) on delete cascade,
  current_level       text not null default 'easy' check (current_level in ('easy', 'medium', 'hard')),
  demotion_used       boolean not null default false,
  served_question_ids jsonb not null default '[]',   -- ids already shown, to avoid repeats
  current_batch_ids   jsonb not null default '[]',      -- the 3 question ids currently in play
  status              text not null default 'active' check (status in ('active', 'completed', 'exited')),
  started_at          timestamptz default now(),
  ended_at            timestamptz
);

create index if not exists idx_adaptive_quiz_sessions_user
  on adaptive_quiz_sessions (user_id, status);

-- 3. Create adaptive_quiz_attempts table
create table if not exists adaptive_quiz_attempts (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references adaptive_quiz_sessions(id) on delete cascade,
  question_id       uuid not null references adaptive_quiz_questions(id) on delete cascade,
  level             text not null,
  selected_answer   text,
  is_correct        boolean not null,
  answered_at       timestamptz default now()
);

create index if not exists idx_adaptive_quiz_attempts_session
  on adaptive_quiz_attempts (session_id);

-- 4. Disable RLS on all these tables to match the development setup of 001_init.sql
alter table adaptive_quiz_questions disable row level security;
alter table adaptive_quiz_sessions   disable row level security;
alter table adaptive_quiz_attempts   disable row level security;

-- 5. Grant anon + authenticated roles full access
grant all on adaptive_quiz_questions to anon, authenticated;
grant all on adaptive_quiz_sessions   to anon, authenticated;
grant all on adaptive_quiz_attempts   to anon, authenticated;
