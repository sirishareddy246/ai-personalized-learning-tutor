# Adaptive quiz — implementation plan

Feed this file to Antigravity as the task brief (e.g. `@IMPLEMENTATION_PLAN.md implement this end to end`). It's ordered so each step is independently testable before the next depends on it.

## 0. Prerequisites (check before starting)

- Supabase project has the `vector` extension already enabled (used for RAG embeddings).
- `.env` in `backend/` has: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROK_API_KEY`, `GROK_MODEL` (check x.ai docs for the current model name — don't hardcode a guess).
- Existing `documents` and `chunks` tables from the RAG pipeline already exist (chunks has `id`, `document_id`, `content`).

## 1. Database layer

Run `supabase/migrations/001_adaptive_quiz_schema.sql`. Creates:
- `quiz_questions` — the generated question pool, tagged by level + chunk
- `quiz_sessions` — one row per quiz attempt, tracks state machine position
- `quiz_attempts` — one row per question answered in a session

**Verify:** insert a dummy row into each table manually in the Supabase SQL editor before wiring up the backend, to confirm RLS policies don't block the service role.

## 2. Backend services

Build in this order, each is testable in isolation with a script or curl:

1. `services/supabase.service.js` — Supabase client (service role, backend-only, never exposed to frontend)
2. `services/grok.service.js` — thin wrapper around the Grok chat completions endpoint. Two functions: `generateQuestionPool()` and `generateMicroSummary()`.
3. `services/quiz.service.js` — the actual state machine (this is the core of the feature — see logic below)

## 3. API layer

`routes/quiz.routes.js` + `controllers/quiz.controller.js`, mounted at `/api/quiz`:

```
POST /api/quiz/start            body: { documentId }        -> creates session, generates/fetches pools, returns first 3 easy questions
POST /api/quiz/answer           body: { sessionId, questionId, selectedAnswer } -> returns next action
POST /api/quiz/exit             body: { sessionId }          -> ends session early, returns feedback
GET  /api/quiz/:sessionId/feedback                           -> final report
```

## 4. Frontend

`frontend/useAdaptiveQuiz.js` — a React hook wrapping the four endpoints above, exposing `{ state, questions, currentQuestion, submitAnswer, exitQuiz, feedback }` to the quiz UI component.

## State machine logic (the important part)

Question pool: generated once per document, 4–5 questions per level (easy/medium/hard), cached in `quiz_questions`. Regenerating on every attempt is wasteful — only regenerate if the pool for that document doesn't exist yet.

Per-level batch: 3 questions served at a time from the level's pool (no repeats within a session — track `served_question_ids` in session state).

**Advance rule:** score ≥ 2/3 on the current level's batch → move up one level.

**Easy fail (< 2/3):**
- Generate a micro-summary scoped only to the `chunk_id`s of the *missed* questions (not the whole document)
- Serve a fresh batch of 3 from the easy pool (excluding already-served questions, if the pool runs out, allow repeats but flag it)
- This does not count as a "demotion" — it's a retry at the same level

**Medium fail (< 2/3):**
- If `demotion_used = false` on the session: set `demotion_used = true`, drop back to easy, serve a new easy batch
- If `demotion_used = true` already (this is the second medium failure): end the session immediately at medium level, generate the final report — do not loop again

**Hard level:** always terminal. After the 3 hard questions are answered (regardless of score), end the session and generate the final report.

**Exit:** at any point, calling `/api/quiz/exit` ends the session immediately and generates a report from whatever was answered so far.

## Final report contents

- Highest level reached (easy / medium / hard) — this is the headline "mastery" signal
- Score per level attempted
- Weak topics — group all incorrect `quiz_attempts` by their question's `chunk_id`, surface the associated chunk content/topic
- Suggested sections to revisit (same chunk references, phrased as a reading list)
