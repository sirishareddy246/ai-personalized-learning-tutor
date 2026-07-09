const axios = require('axios');

// x.ai's API is OpenAI-compatible: POST /v1/chat/completions.
// Double check GROK_MODEL against current x.ai docs before deploying — model
// names change and this file should not hardcode a guess.
const GROK_ENDPOINT = 'https://api.x.ai/v1/chat/completions';

async function callGrok(messages, { jsonMode = false } = {}) {
  const { data } = await axios.post(
    GROK_ENDPOINT,
    {
      model: process.env.GROK_MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return data.choices[0].message.content;
}

/**
 * Generates a question pool for one difficulty level from a set of chunks.
 * chunks: [{ id, content }]
 * Returns: [{ chunk_id, question, options, correct_answer, explanation }]
 */
async function generateQuestionPool(chunks, level, count = 5) {
  const context = chunks
    .map((c) => `[chunk_id: ${c.id}]\n${c.content}`)
    .join('\n\n---\n\n');

  const levelGuidance = {
    easy: 'direct recall — the answer is explicitly stated in the text',
    medium: 'requires connecting two related points from the text',
    hard: 'requires applying or synthesizing the concept, not just recalling it',
  }[level];

  const prompt = `You are generating a ${count}-question multiple-choice quiz at "${level}" difficulty (${levelGuidance}) from the study material below.

Return ONLY a JSON object of this exact shape, no prose:
{
  "questions": [
    {
      "chunk_id": "the chunk_id this question is drawn from",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "B",
      "explanation": "one sentence on why this is correct"
    }
  ]
}

Study material:
${context}`;

  const raw = await callGrok([{ role: 'user', content: prompt }], { jsonMode: true });
  const parsed = JSON.parse(raw);
  return parsed.questions;
}

/**
 * Generates a short, targeted summary from only the chunks tied to missed
 * questions — not the whole document. Used for the easy-level remediation step.
 */
async function generateMicroSummary(missedChunks) {
  const context = missedChunks.map((c) => c.content).join('\n\n---\n\n');

  const prompt = `A student got quiz questions wrong on the following material. Write a short (3-5 sentence) plain-language summary that re-explains just this material, aimed at helping them answer similar questions correctly on a retake. Don't reference "the quiz" or "questions" — just explain the concept clearly.

Material:
${context}`;

  return callGrok([{ role: 'user', content: prompt }]);
}

module.exports = { generateQuestionPool, generateMicroSummary };
