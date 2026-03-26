import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config/index.js';
import { scorePrompt, editPrompt } from './prompts.js';

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

async function score(resumeText, jdText) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: scorePrompt(resumeText, jdText) }],
  });
  const raw = res.choices[0].message.content.replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

async function edit(resumeText, request) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: editPrompt(resumeText, request) }],
  });
  return res.choices[0].message.content.trim();
}

export { score, edit };