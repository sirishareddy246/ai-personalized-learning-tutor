const { generateEmbedding } = require('../services/embeddings.service');
const { generateAnswer } = require('../services/grok.service');
const supabase = require('../services/supabase.service');
const config = require('../config/config');

async function askQuestion(req, res) {
  try {
    const { question, document_id } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });
    if (!document_id) return res.status(400).json({ error: 'document_id is required' });

    const queryEmbedding = await generateEmbedding(question);

    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: config.matchThreshold,
      match_count: config.matchCount,
      doc_id: document_id,
    });
    if (error) throw error;

    if (!chunks || chunks.length === 0) {
      return res.json({ answer: 'No relevant information found in the document for your question. Try rephrasing or uploading more content.' });
    }

    const answer = await generateAnswer(question, chunks.map(c => c.content));
    res.json({ answer, sources: chunks.length });
  } catch (err) {
    console.error('Ask error:', err);
    res.status(500).json({ error: err.message || 'Failed to answer question' });
  }
}

module.exports = { askQuestion };
