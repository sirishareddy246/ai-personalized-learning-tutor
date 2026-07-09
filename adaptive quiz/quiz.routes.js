const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
// const requireAuth = require('../middleware/requireAuth'); // verifies Supabase JWT, sets req.user

// router.use(requireAuth);

router.post('/start', quizController.start);
router.post('/answer', quizController.answer);
router.post('/exit', quizController.exit);
router.get('/:sessionId/feedback', quizController.feedback);

module.exports = router;
