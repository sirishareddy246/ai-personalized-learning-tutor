const { generateQuiz } = require('../services/grok.service');
const supabase = require('../services/supabase.service');

async function generateQuizFromDoc(req, res) {
  try {
    const { document_id, difficulty = 'medium', num_questions = 5 } = req.body;
    if (!document_id) return res.status(400).json({ error: 'document_id is required' });

    const { data: chunks, error } = await supabase
      .from('chunks').select('content').eq('document_id', document_id).limit(10);
    if (error) throw error;
    if (!chunks || chunks.length === 0)
      return res.status(404).json({ error: 'No content found for this document' });

    const quizData = await generateQuiz(chunks.map(c => c.content), difficulty, num_questions);

    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .insert({ document_id, difficulty, questions: quizData.questions })
      .select().single();
    if (quizErr) throw quizErr;

    res.status(201).json({ quiz_id: quiz.id, difficulty, questions: quizData.questions });
  } catch (err) {
    console.error('Quiz gen error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz' });
  }
}

async function submitQuiz(req, res) {
  try {
    const { quiz_id, user_answers } = req.body;
    if (!quiz_id || !user_answers) return res.status(400).json({ error: 'quiz_id and user_answers required' });
    const userId = req.headers['x-user-id'] || null;

    const { data: quiz, error } = await supabase.from('quizzes').select('*').eq('id', quiz_id).single();
    if (error || !quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = quiz.questions;
    let correct = 0;
    const weakTopics = new Set();
    const breakdown = [];

    questions.forEach((q) => {
      const userAns = user_answers[q.id] ?? user_answers[String(q.id)];
      const isCorrect = userAns === q.correct;
      if (isCorrect) correct++;
      else weakTopics.add(q.topic || 'General');
      breakdown.push({ question_id: q.id, question: q.question, user_answer: userAns, correct_answer: q.correct, is_correct: isCorrect, explanation: q.explanation });
    });

    const score = Math.round((correct / questions.length) * 100);
    const weakTopicsArr = Array.from(weakTopics);
    const suggestions = weakTopicsArr.map(t => `Review the topic: "${t}" in your study material.`);

    const { data: attempt } = await supabase.from('quiz_attempts')
      .insert({ quiz_id, user_id: userId, answers: user_answers, score, weak_topics: weakTopicsArr })
      .select().single();

    res.json({ attempt_id: attempt?.id, score, total: questions.length, correct, weak_topics: weakTopicsArr, suggestions, breakdown });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit quiz' });
  }
}

module.exports = { generateQuizFromDoc, submitQuiz };
