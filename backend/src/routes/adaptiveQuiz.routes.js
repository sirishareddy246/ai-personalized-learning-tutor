const express = require('express');
const router = express.Router();
const adaptiveQuizController = require('../controllers/adaptiveQuiz.controller');

router.post('/start', adaptiveQuizController.start);
router.post('/answer', adaptiveQuizController.answer);
router.post('/exit', adaptiveQuizController.exit);
router.get('/:sessionId/feedback', adaptiveQuizController.feedback);

module.exports = router;
