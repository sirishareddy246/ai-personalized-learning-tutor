const express = require('express');
const cors = require('cors');
const config = require('./config/config');

const uploadRoutes = require('./routes/upload.routes');
const askRoutes = require('./routes/ask.routes');
const quizRoutes = require('./routes/quiz.routes');
const feedbackRoutes = require('./routes/feedback.routes');

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api', uploadRoutes);
app.use('/api', askRoutes);
app.use('/api', quizRoutes);
app.use('/api', feedbackRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`🚀 AI Tutor Backend running on http://localhost:${config.port}`);
});

module.exports = app;
