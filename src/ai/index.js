import * as gemini from './gemini.js';

async function score(resumeText, jdText) {
  return await gemini.score(resumeText, jdText);
}

async function edit(resumeText, request) {
  return await gemini.edit(resumeText, request);
}

export { score, edit };