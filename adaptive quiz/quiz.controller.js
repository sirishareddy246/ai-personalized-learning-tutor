const quizService = require('../services/quiz.service');

async function start(req, res) {
  try {
    const { documentId } = req.body;
    const userId = req.user.id; // assumes auth middleware sets req.user from Supabase JWT
    const result = await quizService.startSession(userId, documentId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function answer(req, res) {
  try {
    const { sessionId, questionId, selectedAnswer } = req.body;
    const result = await quizService.submitAnswer(sessionId, questionId, selectedAnswer);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function exit(req, res) {
  try {
    const { sessionId } = req.body;
    const result = await quizService.exitSession(sessionId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function feedback(req, res) {
  try {
    const { sessionId } = req.params;
    const result = await quizService.getFeedback(sessionId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { start, answer, exit, feedback };
