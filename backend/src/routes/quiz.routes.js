const express = require('express');
const { generateQuizFromDoc, submitQuiz } = require('../controllers/quiz.controller');
const router = express.Router();
router.post('/generate-quiz', generateQuizFromDoc);
router.post('/submit-quiz', submitQuiz);
module.exports = router;
