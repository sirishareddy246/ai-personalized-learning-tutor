const axios = require('axios');
const config = require('../config/config');

const apiKey = config.grokApiKey || '';
const isNvidia = apiKey.startsWith('nvapi-');
const isGroq = apiKey.startsWith('gsk_');

let baseURL = 'https://api.x.ai/v1';
let defaultModel = 'grok-3';
let fallbackModel = null;

if (isNvidia) {
  baseURL = 'https://integrate.api.nvidia.com/v1';
  defaultModel = 'meta/llama-3.1-8b-instruct';
  fallbackModel = 'meta/llama-3.1-8b-instruct';
  console.log('🤖 Using LLM Provider: NVIDIA NIM API (meta/llama-3.1-8b-instruct)');
} else if (isGroq) {
  baseURL = 'https://api.groq.com/openai/v1';
  defaultModel = 'llama-3.1-8b-instant';
  fallbackModel = 'llama3-8b-8192';
  console.log('🤖 Using LLM Provider: Groq (llama-3.1-8b-instant)');
} else {
  console.log('🤖 Using LLM Provider: Groq (xAI)');
}

const llmClient = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

async function chat(messages, options = {}) {
  const modelToUse = options.model || defaultModel;
  try {
    const response = await llmClient.post('/chat/completions', {
      model: modelToUse,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 1500,
    });
    return response.data.choices[0].message.content;
  } catch (err) {
    const errMessage = err.response?.data?.error?.message || err.message || '';
    const isModelError = errMessage.includes('does not exist') || errMessage.includes('access');
    const isRateLimit =
      err.response &&
      (err.response.status === 429 ||
        (err.response.data &&
          err.response.data.error &&
          (err.response.data.error.code === 'rate_limit_exceeded' ||
            err.response.data.error.type === 'tokens')));

    if ((isRateLimit || isModelError) && fallbackModel && modelToUse !== fallbackModel) {
      console.warn(`⚠️ Error on ${modelToUse} (${errMessage}). Automatically falling back to ${fallbackModel}...`);
        try {
          const fallbackResponse = await llmClient.post('/chat/completions', {
            model: fallbackModel,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens || 1500,
          });
          return fallbackResponse.data.choices[0].message.content;
        } catch (fallbackErr) {
          console.error('Fallback model error:', fallbackErr.response?.data || fallbackErr.message);
        }
      }

      console.warn('⚠️ Rate limit hit. Waiting 3 seconds before retrying...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        const retryResponse = await llmClient.post('/chat/completions', {
          model: fallbackModel || modelToUse,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens || 1500,
        });
        return retryResponse.data.choices[0].message.content;
      } catch (retryErr) {
        if (retryErr.response && retryErr.response.data) {
          console.error('LLM API Error after retry:', JSON.stringify(retryErr.response.data, null, 2));
          const msg = retryErr.response.data.error?.message || 'Rate limit reached. Please try again in a few seconds.';
          throw new Error(`LLM Rate Limit: ${msg}`);
        }
        throw retryErr;
      }
    }

    if (err.response && err.response.data) {
      console.error('LLM API Error:', JSON.stringify(err.response.data, null, 2));
      throw new Error(`LLM API Error: ${err.response.data.error?.message || JSON.stringify(err.response.data)}`);
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

async function generateAllAdaptiveQuestions(chunks, countPerLevel = 3) {
  const limitedChunks = chunks.slice(0, 2).map((c) => ({
    id: c.id,
    content: c.content ? c.content.substring(0, 1200) : '',
  }));
  const context = limitedChunks
    .map((c) => `[chunk_id: ${c.id}]\n${c.content}`)
    .join('\n\n---\n\n');

  const prompt = `You are an expert quiz generator. Generate a multiple-choice question pool from the study material below.
For each difficulty level (easy, medium, hard), generate exactly ${countPerLevel} questions:
- "easy" questions: direct recall — the answer is explicitly stated in the text.
- "medium" questions: requires connecting two related points from the text.
- "hard" questions: requires applying or synthesizing the concept, not just recalling it.

Each question must be mapped to the correct [chunk_id] it is drawn from.

Return ONLY a JSON object of this exact shape, with no other text, prose, or markdown formatting:
{
  "easy": [
    {
      "chunk_id": "the chunk_id this question is drawn from",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "B",
      "explanation": "..."
    }
  ],
  "medium": [
    {
      "chunk_id": "the chunk_id this question is drawn from",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "C",
      "explanation": "..."
    }
  ],
  "hard": [
    {
      "chunk_id": "the chunk_id this question is drawn from",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A",
      "explanation": "..."
    }
  ]
}`;

  const raw = await chat(
    [
      { role: 'system', content: prompt },
      { role: 'user', content: `Study Material:\n${context}` },
    ],
    {
      temperature: 0.4,
      maxTokens: 2500,
    }
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM returned invalid adaptive quiz JSON');
  return JSON.parse(jsonMatch[0]);
}

async function generateMicroSummary(missedChunks) {
  if (!missedChunks || missedChunks.length === 0) return '';
  const context = missedChunks.map((c) => c.content).join('\n\n---\n\n');

  const prompt = `A student got quiz questions wrong on the following material. Write a short (3-5 sentence) plain-language summary that re-explains just this material, aimed at helping them answer similar questions correctly on a retake. Don't reference "the quiz" or "questions" — just explain the concept clearly.`;

  return chat([
    { role: 'system', content: prompt },
    { role: 'user', content: `Material:\n${context}` },
  ]);
}

module.exports = {
  chat,
  generateAnswer,
  generateQuiz,
  generateAllAdaptiveQuestions,
  generateMicroSummary,
};
