const supabase = require('./supabase.service');
const { generateAllAdaptiveQuestions, generateMicroSummary } = require('./grok.service');

const BATCH_SIZE = 3;
const PASS_THRESHOLD = 2 / 3;
const LEVEL_ORDER = ['easy', 'medium', 'hard'];

// ---------- pool generation (runs once per document, cached) ----------

async function ensureQuestionPool(documentId) {
  const { data: existing, error: existErr } = await supabase
    .from('adaptive_quiz_questions')
    .select('id')
    .eq('document_id', documentId)
    .limit(1);

  if (existErr) {
    console.error('Error checking existing adaptive quiz pool:', existErr);
  }

  if (existing?.length) return; // pool already generated

  const { data: chunks, error: chunkErr } = await supabase
    .from('chunks')
    .select('id, content')
    .eq('document_id', documentId);

  if (chunkErr) throw chunkErr;

  if (!chunks?.length) throw new Error('No chunks found for document — has it finished processing?');

  const pool = await generateAllAdaptiveQuestions(chunks, 3);
  const validChunkIds = new Set(chunks.map((c) => c.id));

  for (const level of LEVEL_ORDER) {
    const questions = pool[level] || [];
    const rows = questions.map((q) => ({
      document_id: documentId,
      chunk_id: q.chunk_id && validChunkIds.has(q.chunk_id) ? q.chunk_id : null,
      level,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));
    if (rows.length > 0) {
      const { error: insertErr } = await supabase.from('adaptive_quiz_questions').insert(rows);
      if (insertErr) throw insertErr;
    }
  }
}

async function pickBatch(documentId, level, excludeIds) {
  let query = supabase
    .from('adaptive_quiz_questions')
    .select('id, question, options')
    .eq('document_id', documentId)
    .eq('level', level);

  const { data: pool, error } = await query;
  if (error) throw error;
  const unseen = pool.filter((q) => !excludeIds.includes(q.id));
  const source = unseen.length >= BATCH_SIZE ? unseen : pool; // allow repeats if pool exhausted
  return shuffle(source).slice(0, BATCH_SIZE);
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ---------- session lifecycle ----------

async function startSession(userId, documentId) {
  await ensureQuestionPool(documentId);

  const batch = await pickBatch(documentId, 'easy', []);

  const { data: session, error } = await supabase
    .from('adaptive_quiz_sessions')
    .insert({
      user_id: userId,
      document_id: documentId,
      current_level: 'easy',
      served_question_ids: batch.map((q) => q.id),
      current_batch_ids: batch.map((q) => q.id),
    })
    .select()
    .single();

  if (error) throw error;

  return { session, questions: batch };
}

async function submitAnswer(sessionId, questionId, selectedAnswer) {
  const { data: session, error: sessErr } = await supabase
    .from('adaptive_quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessErr || !session) {
    throw new Error('Session not found');
  }

  if (session.status !== 'active') {
    throw new Error('Session is not active');
  }

  const { data: question, error: qErr } = await supabase
    .from('adaptive_quiz_questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (qErr || !question) {
    throw new Error('Question not found');
  }

  const isCorrect = selectedAnswer === question.correct_answer;

  const { error: attemptErr } = await supabase.from('adaptive_quiz_attempts').insert({
    session_id: sessionId,
    question_id: questionId,
    level: question.level,
    selected_answer: selectedAnswer,
    is_correct: isCorrect,
  });

  if (attemptErr) throw attemptErr;

  const batchComplete = await isBatchComplete(sessionId, session.current_batch_ids);

  if (!batchComplete) {
    return { status: 'in_progress', isCorrect, explanation: question.explanation };
  }

  const batchResult = await evaluateBatch(session);
  return { ...batchResult, isCorrect, explanation: question.explanation };
}

async function isBatchComplete(sessionId, batchIds) {
  const { data: attempts, error } = await supabase
    .from('adaptive_quiz_attempts')
    .select('question_id, answered_at')
    .eq('session_id', sessionId)
    .in('question_id', batchIds)
    .order('answered_at', { ascending: false });

  if (error) throw error;
  const uniqueAttemptedQuestionIds = new Set(attempts.map((a) => a.question_id));
  return uniqueAttemptedQuestionIds.size >= batchIds.length;
}

async function evaluateBatch(session) {
  const { data: attempts, error } = await supabase
    .from('adaptive_quiz_attempts')
    .select('question_id, is_correct, answered_at')
    .eq('session_id', session.id)
    .in('question_id', session.current_batch_ids)
    .order('answered_at', { ascending: false });

  if (error) throw error;

  // Deduplicate attempts to get the latest attempt per question_id
  const latestAttemptByQ = new Map();
  for (const a of attempts) {
    if (!latestAttemptByQ.has(a.question_id)) {
      latestAttemptByQ.set(a.question_id, a);
    }
  }

  const latestAttempts = Array.from(latestAttemptByQ.values());
  const correctCount = latestAttempts.filter((a) => a.is_correct).length;
  const score = correctCount / (latestAttempts.length || 1);
  const passed = score >= PASS_THRESHOLD;

  if (passed) {
    return handlePass(session);
  }
  return handleFail(session, score);
}

async function handlePass(session) {
  const currentIndex = LEVEL_ORDER.indexOf(session.current_level);

  if (session.current_level === 'hard') {
    return endSession(session, 'completed');
  }

  const nextLevel = LEVEL_ORDER[currentIndex + 1];
  const batch = await pickBatch(session.document_id, nextLevel, session.served_question_ids);

  const { error } = await supabase
    .from('adaptive_quiz_sessions')
    .update({
      current_level: nextLevel,
      served_question_ids: [...session.served_question_ids, ...batch.map((q) => q.id)],
      current_batch_ids: batch.map((q) => q.id),
    })
    .eq('id', session.id);

  if (error) throw error;

  return { status: 'advanced', level: nextLevel, questions: batch };
}

async function handleFail(session, score) {
  if (session.current_level === 'easy') {
    // remediation: targeted micro-summary from missed chunks, then retake at easy
    const summary = await buildMicroSummary(session.id, session.current_batch_ids);
    const batch = await pickBatch(session.document_id, 'easy', session.served_question_ids);

    const { error } = await supabase
      .from('adaptive_quiz_sessions')
      .update({
        served_question_ids: [...session.served_question_ids, ...batch.map((q) => q.id)],
        current_batch_ids: batch.map((q) => q.id),
      })
      .eq('id', session.id);

    if (error) throw error;

    return { status: 'remediation', summary, level: 'easy', questions: batch };
  }

  if (session.current_level === 'medium') {
    if (!session.demotion_used) {
      const batch = await pickBatch(session.document_id, 'easy', session.served_question_ids);

      const { error } = await supabase
        .from('adaptive_quiz_sessions')
        .update({
          current_level: 'easy',
          demotion_used: true,
          served_question_ids: [...session.served_question_ids, ...batch.map((q) => q.id)],
          current_batch_ids: batch.map((q) => q.id),
        })
        .eq('id', session.id);

      if (error) throw error;

      return { status: 'demoted', level: 'easy', questions: batch };
    }
    // already demoted once — second medium failure ends the quiz
    return endSession(session, 'completed');
  }

  // hard level: fail or pass, it's terminal either way
  return endSession(session, 'completed');
}

async function buildMicroSummary(sessionId, batchIds) {
  const { data: missed, error: missErr } = await supabase
    .from('adaptive_quiz_attempts')
    .select('question_id')
    .eq('session_id', sessionId)
    .eq('is_correct', false)
    .in('question_id', batchIds);

  if (missErr || !missed) return '';

  const missedQuestionIds = missed.map((m) => m.question_id);
  if (missedQuestionIds.length === 0) return '';

  const { data: questions, error: qErr } = await supabase
    .from('adaptive_quiz_questions')
    .select('chunk_id')
    .in('id', missedQuestionIds);

  if (qErr || !questions) return '';

  const chunkIds = [...new Set(questions.map((q) => q.chunk_id).filter(Boolean))];
  if (chunkIds.length === 0) return '';

  const { data: chunks, error: cErr } = await supabase
    .from('chunks')
    .select('id, content')
    .in('id', chunkIds);

  if (cErr || !chunks || chunks.length === 0) return '';

  return generateMicroSummary(chunks);
}

async function exitSession(sessionId) {
  const { data: session, error } = await supabase
    .from('adaptive_quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !session) throw new Error('Session not found');

  return endSession(session, 'exited');
}

async function endSession(session, status) {
  const { error } = await supabase
    .from('adaptive_quiz_sessions')
    .update({ status, ended_at: new Date().toISOString() })
    .eq('id', session.id);

  if (error) throw error;

  const feedback = await getFeedback(session.id);
  return { status: 'ended', reason: status, feedback };
}

// ---------- feedback ----------

async function getFeedback(sessionId) {
  const { data: session, error: sessErr } = await supabase
    .from('adaptive_quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessErr) throw sessErr;

  const { data: attempts, error: attErr } = await supabase
    .from('adaptive_quiz_attempts')
    .select('*, adaptive_quiz_questions(chunk_id, level)')
    .eq('session_id', sessionId);

  if (attErr) throw attErr;

  const scoreByLevel = LEVEL_ORDER.reduce((acc, level) => {
    const levelAttempts = attempts.filter((a) => a.level === level);
    if (!levelAttempts.length) return acc;
    acc[level] = {
      correct: levelAttempts.filter((a) => a.is_correct).length,
      total: levelAttempts.length,
    };
    return acc;
  }, {});

  const missedChunkIds = [
    ...new Set(
      attempts
        .filter((a) => !a.is_correct && a.adaptive_quiz_questions)
        .map((a) => a.adaptive_quiz_questions.chunk_id)
        .filter(Boolean)
    ),
  ];

  const { data: weakChunks, error: chunkErr } = missedChunkIds.length
    ? await supabase.from('chunks').select('id, content').in('id', missedChunkIds)
    : { data: [], error: null };

  if (chunkErr) throw chunkErr;

  const highestLevelReached = LEVEL_ORDER.filter((l) => scoreByLevel[l]).pop() || 'easy';

  return {
    highestLevelReached,
    scoreByLevel,
    weakTopics: weakChunks,
  };
}

module.exports = { startSession, submitAnswer, exitSession, getFeedback };
