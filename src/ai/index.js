import * as gemini from './gemini.js';
import * as openai from './openai.js';

async function score(resumeText, jdText) {
  try {
    return await gemini.score(resumeText, jdText);
  } catch (err) {
    console.warn('Gemini failed, falling back to OpenAI:', err.message);
    return await openai.score(resumeText, jdText);
  }
}

async function edit(resumeText, request) {
  try {
    return await gemini.edit(resumeText, request);
  } catch (err) {
    console.warn('Gemini failed, falling back to OpenAI:', err.message);
    return await openai.edit(resumeText, request);
  }
}

export { score, edit };