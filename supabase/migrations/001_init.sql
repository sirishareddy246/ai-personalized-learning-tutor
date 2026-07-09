-- ============================================================
-- 001_init.sql — AI Personalized Learning Tutor Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Documents table
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  filename    text not null,
  storage_path text,
  created_at  timestamptz default now()
);

-- 3. Chunks table (stores text chunks + embeddings)
create table if not exists chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid references documents(id) on delete cascade,
  content      text not null,
  embedding    vector(384),
  chunk_index  integer,
  created_at   timestamptz default now()
);

-- 4. HNSW index for fast vector search
create index if not exists chunks_embedding_idx
  on chunks using hnsw (embedding vector_cosine_ops);

-- 5. Quizzes table
create table if not exists quizzes (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid references documents(id) on delete cascade,
  difficulty   text check (difficulty in ('easy', 'medium', 'hard')),
  questions    jsonb,
  created_at   timestamptz default now()
);

-- 6. Quiz attempts table
create table if not exists quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid references quizzes(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  answers      jsonb,
  score        numeric,
  weak_topics  jsonb,
  created_at   timestamptz default now()
);

-- 7. Vector similarity search function
create or replace function match_chunks(
  query_embedding vector(384),
  match_threshold float,
  match_count     int,
  doc_id          uuid
)
returns table (id uuid, content text, similarity float)
language sql stable
as $$
  select
    chunks.id,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where chunks.document_id = doc_id
    and 1 - (chunks.embedding <=> query_embedding) > match_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- 8. Disable RLS on all tables (allows anon key to read/write — fine for dev)
alter table documents disable row level security;
alter table chunks disable row level security;
alter table quizzes disable row level security;
alter table quiz_attempts disable row level security;

-- 9. Grant anon + authenticated roles full access
grant all on documents    to anon, authenticated;
grant all on chunks       to anon, authenticated;
grant all on quizzes      to anon, authenticated;
grant all on quiz_attempts to anon, authenticated;
grant execute on function match_chunks to anon, authenticated;

-- 10. Storage bucket (run if bucket doesn't exist yet)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

grant all on storage.objects to anon, authenticated;
