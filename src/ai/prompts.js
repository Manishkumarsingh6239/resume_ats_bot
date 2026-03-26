// src/ai/prompts.js

function scorePrompt(resumeText, jdText) {
  return `You are a strict ATS evaluator and expert resume coach.
Analyze the resume against the job description.
Reply ONLY in this exact JSON format, no extra text, no markdown, no backticks:
{
  "score": {
    "overall": 7,
    "categories": [
      { "name": "Skills Match", "score": 7 },
      { "name": "Experience Relevance", "score": 8 },
      { "name": "Keywords & ATS", "score": 6 },
      { "name": "Education Fit", "score": 7 }
    ],
    "reasoning": "One sentence explanation of the overall score."
  },
  "keywords": ["missing keyword 1", "missing keyword 2"],
  "formatting": ["formatting issue 1"],
  "content": ["content gap 1", "content gap 2"],
  "optimizedResume": "Full rewritten resume text, tailored to the job description. Keep all real experience, reframe with relevant keywords. Plain text only.",
  "transitionRoadmap": [
    { "step": "Action to take", "why": "Why this matters for the target role" }
  ],
  "skillsToPractice": [
    { "skill": "Skill name", "gap": "Why it is missing or weak", "resource": "Free resource or action" }
  ]
}

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}`;
}

function editPrompt(resumeText, request) {
  return `You are a resume editor. Apply the requested change to the resume.
Return ONLY the updated resume text. No commentary, no markdown, no explanations.

Change requested: ${request}

Resume:
${resumeText}`;
}

export { scorePrompt, editPrompt };