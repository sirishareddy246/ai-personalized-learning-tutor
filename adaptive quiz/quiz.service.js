const { supabase } = require('./supabase.service');
const { generateQuestionPool, generateMicroSummary } = require('./grok.service');

const BATCH_SIZE = 3;
const PASS_THRESHOLD = 2 / 3;
const LEVEL_ORDER = ['easy', 'medium', 'hard'];

// ---------- pool generation (runs once per document, cached) ----------

async function ensureQuestionPool(documentId) {
  const { data: existing } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('document_id', documentId)
    .limit(1);

  if (existing?.length) return; // pool already generated

  const { data: chunks } = await supabase
    .from('chunks')
    .select('id, content')
    .eq('document_id', documentId);

  if (!chunks?.length) throw new Error('No chunks found for document — has it finished processing?');

  for (const level of LEVEL_ORDER) {
    const questions = await generateQuestionPool(chunks, level, 5);
    const rows = questions.map((q) => ({
      document_id: documentId,
      chunk_id: q.chunk_id,
      level,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));
    await supabase.from('quiz_questions').insert(rows);
  }
}

async function pickBatch(documentId, level, excludeIds) {
  let query = supabase
    .from('quiz_questions')
    .select('id, question, options')
    .eq('document_id', documentId)
    .eq('level', level);

  const { data: pool } = await query;
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

  const { data: session } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      document_id: documentId,
      current_level: 'easy',
      served_question_ids: batch.map((q) => q.id),
      current_batch_ids: batch.map((q) => q.id),
    })
    .select()
    .single();

  return { session, questions: batch };
}

async function submitAnswer(sessionId, questionId, selectedAnswer) {
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session || session.status !== 'active') {
    throw new Error('Session is not active');
  }

  const { data: question } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('id', questionId)
    .single();

  const isCorrect = selectedAnswer === question.correct_answer;

  await supabase.from('quiz_attempts').insert({
    session_id: sessionId,
    question_id: questionId,
    level: question.level,
    selected_answer: selectedAnswer,
    is_correct: isCorrect,
  });

  const batchComplete = await isBatchComplete(sessionId, session.current_batch_ids);

  if (!batchComplete) {
    return { status: 'in_progress', isCorrect, explanation: question.explanation };
  }

  return evaluateBatch(session);
}

async function isBatchComplete(sessionId, batchIds) {
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('question_id')
    .eq('session_id', sessionId)
    .in('question_id', batchIds);

  return attempts.length >= batchIds.length;
}

async function evaluateBatch(session) {
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('is_correct')
    .eq('session_id', session.id)
    .in('question_id', session.current_batch_ids);

  const correctCount = attempts.filter((a) => a.is_correct).length;
  const score = correctCount / attempts.length;
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

  await supabase
    .from('quiz_sessions')
    .update({
      current_level: nextLevel,
      served_question_ids: [...session.served_question_ids, ...batch.map((q) => q.id)],
      current_batch_ids: batch.map((q) => q.id),
    })
    .eq('id', session.id);

  return { status: 'advanced', level: nextLevel, questions: batch };
}

async function handleFail(session, score) {
  if (session.current_level === 'easy') {
    // remediation: targeted micro-summary from missed chunks, then retake at easy
    const summary = await buildMicroSummary(session.id, session.current_batch_ids);
    const batch = await pickBatch(session.document_id, 'easy', session.served_question_ids);

    await supabase
      .from('quiz_sessions')
      .update({
        served_question_ids: [...session.served_question_ids, ...batch.map((q) => q.id)],
        current_batch_ids: batch.map((q) => q.id),
      })
      .eq('id', session.id);

    return { status: 'remediation', summary, level: 'easy', questions: batch };
  }

  if (session.current_level === 'medium') {
    if (!session.demotion_used) {
      const batch = await pickBatch(session.document_id, 'easy', session.served_question_ids);

      await supabase
        .from('quiz_sessions')
        .update({
          current_level: 'easy',
          demotion_used: true,
          served_question_ids: [...session.served_question_ids, ...batch.map((q) => q.id)],
          current_batch_ids: batch.map((q) => q.id),
        })
        .eq('id', session.id);

      return { status: 'demoted', level: 'easy', questions: batch };
    }
    // already demoted once — second medium failure ends the quiz
    return endSession(session, 'completed');
  }

  // hard level: fail or pass, it's terminal either way
  return endSession(session, 'completed');
}

async function buildMicroSummary(sessionId, batchIds) {
  const { data: missed } = await supabase
    .from('quiz_attempts')
    .select('question_id')
    .eq('session_id', sessionId)
    .eq('is_correct', false)
    .in('question_id', batchIds);

  const missedQuestionIds = missed.map((m) => m.question_id);

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('chunk_id')
    .in('id', missedQuestionIds);

  const chunkIds = [...new Set(questions.map((q) => q.chunk_id))];

  const { data: chunks } = await supabase
    .from('chunks')
    .select('id, content')
    .in('id', chunkIds);

  return generateMicroSummary(chunks);
}

async function exitSession(sessionId) {
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  return endSession(session, 'exited');
}

async function endSession(session, status) {
  await supabase
    .from('quiz_sessions')
    .update({ status, ended_at: new Date().toISOString() })
    .eq('id', session.id);

  const feedback = await getFeedback(session.id);
  return { status: 'ended', reason: status, feedback };
}

// ---------- feedback ----------

async function getFeedback(sessionId) {
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*, quiz_questions(chunk_id, level)')
    .eq('session_id', sessionId);

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
      attempts.filter((a) => !a.is_correct).map((a) => a.quiz_questions.chunk_id)
    ),
  ];

  const { data: weakChunks } = missedChunkIds.length
    ? await supabase.from('chunks').select('id, content').in('id', missedChunkIds)
    : { data: [] };

  const highestLevelReached = LEVEL_ORDER.filter((l) => scoreByLevel[l]).pop();

  return {
    highestLevelReached,
    scoreByLevel,
    weakTopics: weakChunks,
  };
}

module.exports = { startSession, submitAnswer, exitSession, getFeedback };
