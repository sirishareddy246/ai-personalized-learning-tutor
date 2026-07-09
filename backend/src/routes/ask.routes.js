const express = require('express');
const { askQuestion } = require('../controllers/rag.controller');
const router = express.Router();
router.post('/ask', askQuestion);
module.exports = router;
