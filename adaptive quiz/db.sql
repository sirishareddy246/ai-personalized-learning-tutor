-- Adaptive quiz schema
-- Assumes `documents` and `chunks` tables already exist from the RAG pipeline.

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_id uuid references chunks(id) on delete set null,
  level text not null check (level in ('easy', 'medium', 'hard')),
  question text not null,
  options jsonb not null,           -- e.g. ["A) ...", "B) ...", "C) ...", "D) ..."]
  correct_answer text not null,     -- e.g. "B"
  explanation text,
  created_at timestamptz default now()
);

create index if not exists idx_quiz_questions_document_level
  on quiz_questions (document_id, level);

create table if not exists quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  current_level text not null default 'easy' check (current_level in ('easy', 'medium', 'hard')),
  demotion_used boolean not null default false,
  served_question_ids jsonb not null default '[]',   -- ids already shown, to avoid repeats
  current_batch_ids jsonb not null default '[]',      -- the 3 question ids currently in play
  status text not null default 'active' check (status in ('active', 'completed', 'exited')),
  started_at timestamptz default now(),
  ended_at timestamptz
);

create index if not exists idx_quiz_sessions_user
  on quiz_sessions (user_id, status);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references quiz_sessions(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  level text not null,
  selected_answer text,
  is_correct boolean not null,
  answered_at timestamptz default now()
);

create index if not exists idx_quiz_attempts_session
  on quiz_attempts (session_id);

-- Row level security: users can only touch their own sessions/attempts.
alter table quiz_sessions enable row level security;
alter table quiz_attempts enable row level security;

create policy "users manage their own quiz sessions"
  on quiz_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage attempts on their own sessions"
  on quiz_attempts for all
  using (
    exists (
      select 1 from quiz_sessions
      where quiz_sessions.id = quiz_attempts.session_id
      and quiz_sessions.user_id = auth.uid()
    )
  );

-- quiz_questions is read via the backend service role only (question pool
-- generation and correct-answer checks should never be exposed to the client),
-- so RLS stays off for this table and all access goes through the Express API.
