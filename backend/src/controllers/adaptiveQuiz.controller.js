const adaptiveQuizService = require('../services/adaptiveQuiz.service');

async function start(req, res) {
  try {
    const { documentId } = req.body;
    const userId = req.headers['x-user-id'] || null;
    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }
    const result = await adaptiveQuizService.startSession(userId, documentId);
    res.json(result);
  } catch (err) {
    console.error('Error starting adaptive quiz:', err);
    res.status(500).json({ error: err.message });
  }
}

async function answer(req, res) {
  try {
    const { sessionId, questionId, selectedAnswer } = req.body;
    if (!sessionId || !questionId || !selectedAnswer) {
      return res.status(400).json({ error: 'sessionId, questionId, and selectedAnswer are required' });
    }
    const result = await adaptiveQuizService.submitAnswer(sessionId, questionId, selectedAnswer);
    res.json(result);
  } catch (err) {
    console.error('Error submitting answer:', err);
    res.status(500).json({ error: err.message });
  }
}

async function exit(req, res) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    const result = await adaptiveQuizService.exitSession(sessionId);
    res.json(result);
  } catch (err) {
    console.error('Error exiting adaptive quiz:', err);
    res.status(500).json({ error: err.message });
  }
}

async function feedback(req, res) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    const result = await adaptiveQuizService.getFeedback(sessionId);
    res.json(result);
  } catch (err) {
    console.error('Error fetching adaptive quiz feedback:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { start, answer, exit, feedback };
