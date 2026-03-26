// src/services/session.js
const sessions = new Map();

const DAILY_LIMIT = 3;

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      step: 'awaiting_resume',
      resumeText: '',
      jdText: '',
      editedText: '',
      optimizedResume: null,   // structured JSON from Gemini
      lastScore: null,
      coverLetter: null,
      interviewPrep: null,
      tweakCount: 0,
      dailyCount: 0,
      lastAnalysisDate: null,
    });
  }
  return sessions.get(chatId);
}

function resetSession(chatId) {
  const existing = sessions.get(chatId);
  // Preserve rate limit data across resets
  const dailyCount = existing?.dailyCount || 0;
  const lastAnalysisDate = existing?.lastAnalysisDate || null;
  sessions.delete(chatId);
  const fresh = getSession(chatId);
  fresh.dailyCount = dailyCount;
  fresh.lastAnalysisDate = lastAnalysisDate;
  return fresh;
}

function checkLimit(chatId) {
  const session = getSession(chatId);
  const today = new Date().toISOString().split('T')[0];

  if (session.lastAnalysisDate !== today) {
    session.dailyCount = 0;
    session.lastAnalysisDate = today;
  }

  return {
    allowed: session.dailyCount < DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - session.dailyCount),
  };
}

function incrementCount(chatId) {
  const session = getSession(chatId);
  const today = new Date().toISOString().split('T')[0];
  if (session.lastAnalysisDate !== today) {
    session.dailyCount = 0;
    session.lastAnalysisDate = today;
  }
  session.dailyCount += 1;
}

export { getSession, resetSession, checkLimit, incrementCount, DAILY_LIMIT };