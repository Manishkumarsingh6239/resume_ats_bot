// src/ai/prompts.js

function scorePrompt(resumeText, jdText) {
  return `You are a strict ATS evaluator and expert resume coach.
Analyze the resume against the job description.
Reply ONLY in this exact JSON format — no extra text, no markdown, no backticks:
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
  "content": ["content gap 1"],
  "optimizedResume": {
    "name": "Candidate Name",
    "contact": "email | phone | linkedin",
    "summary": "Tailored professional summary for this role.",
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "duration": "Jan 2022 – Present",
        "bullets": ["Achievement 1", "Achievement 2"]
      }
    ],
    "skills": ["skill1", "skill2", "skill3"],
    "education": [
      { "degree": "B.Sc Computer Science", "institution": "University Name", "year": "2021" }
    ]
  },
  "transitionRoadmap": [
    { "step": "Action to take", "why": "Why this matters" }
  ],
  "skillsToPractice": [
    { "skill": "Skill name", "gap": "Why it is missing or weak" }
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

function coverLetterPrompt(jdText, optimizedResume) {
  return `You are an expert cover letter writer.
Write a professional, tailored cover letter based on the job description and resume.

Rules:
- 3 paragraphs: strong hook + value proposition + call to action
- Reference actual skills and achievements from the resume
- Professional but warm tone
- Maximum 300 words
- Do NOT use placeholders like [Company Name] — infer from JD or omit

Return ONLY the cover letter text. No subject line, no commentary.

JOB DESCRIPTION:
${jdText}

RESUME:
${JSON.stringify(optimizedResume, null, 2)}`;
}

function interviewPrepPrompt(jdText, optimizedResume) {
  return `You are an expert interview coach.
Based on the job description and the candidate's resume, generate exactly 5 likely interview questions with strong answer guidance.

Reply ONLY in this exact JSON format — no markdown, no backticks:
[
  {
    "question": "Interview question here?",
    "why": "Why this is likely to be asked",
    "tip": "How to answer it strongly in 2-3 sentences"
  }
]

JOB DESCRIPTION:
${jdText}

RESUME:
${JSON.stringify(optimizedResume, null, 2)}`;
}

function skillCoachPrompt(skillName, jobContext) {
  return `You are a career coach and learning advisor.

The candidate is applying for: ${jobContext}
They want to learn: ${skillName}

Give them a quick, practical learning plan.
Reply ONLY in this exact JSON format — no markdown, no backticks:
{
  "skill": "${skillName}",
  "overview": "One sentence — what this skill is and why it matters for the role.",
  "roadmap": ["Step 1", "Step 2", "Step 3"],
  "resources": [
    { "type": "YouTube", "title": "Video title", "url": "https://youtube.com/..." },
    { "type": "Course", "title": "Course name", "url": "https://..." },
    { "type": "Docs", "title": "Resource name", "url": "https://..." }
  ],
  "timeEstimate": "~X weeks to be job-ready"
}`;
}

export { scorePrompt, editPrompt, coverLetterPrompt, interviewPrepPrompt, skillCoachPrompt };