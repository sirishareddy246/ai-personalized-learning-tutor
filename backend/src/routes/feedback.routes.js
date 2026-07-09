const express = require('express');
const { getFeedback } = require('../controllers/feedback.controller');
const router = express.Router();
router.get('/feedback/:id', getFeedback);
module.exports = router;
