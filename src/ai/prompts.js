function scorePrompt(resumeText, jdText) {
  return `You are a strict ATS evaluator. Score this resume against the job description.
Reply ONLY in this exact JSON format, no extra text or markdown:
{
  "score": 7,
  "reason": "one sentence summary",
  "keywords": ["missing keyword 1", "missing keyword 2"],
  "formatting": ["formatting issue 1"],
  "content": ["content gap 1", "content gap 2"]
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