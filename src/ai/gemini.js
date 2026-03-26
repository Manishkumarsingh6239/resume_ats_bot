import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config/index.js';
import { scorePrompt, editPrompt } from './prompts.js';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function score(resumeText, jdText) {
  const result = await model.generateContent(scorePrompt(resumeText, jdText));
  const raw = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

async function edit(resumeText, request) {
  const result = await model.generateContent(editPrompt(resumeText, request));
  return result.response.text().trim();
}

export { score, edit };