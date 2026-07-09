const axios = require('axios');
const config = require('../config/config');

// Determine if we are using Groq (gsk_...) or Grok (x.ai)
const isGroq = config.grokApiKey && config.grokApiKey.startsWith('gsk_');
const baseURL = isGroq ? 'https://api.groq.com/openai/v1' : config.grokBaseUrl;
const defaultModel = isGroq ? 'llama-3.3-70b-versatile' : config.grokModel;

console.log(`🤖 Using LLM Provider: ${isGroq ? 'Groq (llama-3.3-70b-versatile)' : 'Grok (xAI)'}`);

const llmClient = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${config.grokApiKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

async function chat(messages, options = {}) {
  try {
    const response = await llmClient.post('/chat/completions', {
      model: options.model || defaultModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 1500,
    });
    return response.data.choices[0].message.content;
  } catch (err) {
    if (err.response && err.response.data) {
      console.error('LLM API Error:', JSON.stringify(err.response.data, null, 2));
      throw new Error(`LLM API Error: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

async function generateAnswer(question, contextChunks) {
  const context = contextChunks.join('\n\n---\n\n');
  return chat([
    {
      role: 'system',
      content: `You are an expert AI tutor. Use ONLY the following study material context to answer the student's question clearly and helpfully. If the answer is not found in the context, state that clearly.\n\nContext:\n${context}`,
    },
    { role: 'user', content: question },
  ]);
}

async function generateQuiz(contextChunks, difficulty = 'medium', numQuestions = 5) {
  const context = contextChunks.slice(0, 8).join('\n\n---\n\n');
  const raw = await chat(
    [
      {
        role: 'system',
        content: `You are an expert quiz generator. Generate exactly ${numQuestions} multiple-choice questions at ${difficulty} difficulty from the study material below. Respond with ONLY valid JSON, no markdown fences:
{
  "questions": [
    {
      "id": 1,
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "A",
      "explanation": "...",
      "topic": "..."
    }
  ]
}`,
      },
      { role: 'user', content: `Study Material:\n${context}` },
    ],
    { temperature: 0.4, maxTokens: 2000 }
  );
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM returned invalid quiz JSON');
  return JSON.parse(jsonMatch[0]);
}

module.exports = { chat, generateAnswer, generateQuiz };

