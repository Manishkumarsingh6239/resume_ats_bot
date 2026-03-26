const sessions = new Map();

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      step: 'awaiting_resume',
      resumeText: '',
      jdText: '',
      editedText: '',
      lastScore: null,
    });
  }
  return sessions.get(chatId);
}

function resetSession(chatId) {
  sessions.delete(chatId);
}

module.exports = { getSession, resetSession };