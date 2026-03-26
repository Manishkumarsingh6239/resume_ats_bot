// src/ai/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config/index.js';
import { scorePrompt, editPrompt, coverLetterPrompt, interviewPrepPrompt, skillCoachPrompt } from './prompts.js';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function score(resumeText, jdText) {
  const result = await model.generateContent(scorePrompt(resumeText, jdText));
  return parseJSON(result.response.text());
}

async function edit(resumeText, request) {
  const result = await model.generateContent(editPrompt(resumeText, request));
  return result.response.text().trim();
}

async function coverLetter(jdText, optimizedResume) {
  const result = await model.generateContent(coverLetterPrompt(jdText, optimizedResume));
  return result.response.text().trim();
}

async function interviewPrep(jdText, optimizedResume) {
  const result = await model.generateContent(interviewPrepPrompt(jdText, optimizedResume));
  return parseJSON(result.response.text());
}

async function skillCoach(skillName, jobContext) {
  const result = await model.generateContent(skillCoachPrompt(skillName, jobContext));
  return parseJSON(result.response.text());
}

export { score, edit, coverLetter, interviewPrep, skillCoach };