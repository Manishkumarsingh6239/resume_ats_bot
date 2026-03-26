// src/bot/keyboards.js

// ── After analysis ───────────────────────────────────────
const analysisKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📄 Download PDF', callback_data: 'dl_pdf' },
        { text: '📝 Download DOCX', callback_data: 'dl_docx' },
      ],
      [
        { text: '✏️ Edit Resume', callback_data: 'edit' },
        { text: '💌 Cover Letter', callback_data: 'cover_letter' },
      ],
      [
        { text: '🎯 Interview Prep', callback_data: 'interview_prep' },
      ],
    ],
  },
};

// ── After editing ────────────────────────────────────────
const actionKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📄 Download PDF', callback_data: 'dl_pdf' },
        { text: '📝 Download DOCX', callback_data: 'dl_docx' },
      ],
      [
        { text: '✏️ Edit Again', callback_data: 'edit' },
        { text: '🔄 New Scan', callback_data: 'new_scan' },
      ],
    ],
  },
};

// ── Skill buttons — built dynamically from missing skills ─
function skillsKeyboard(skills = []) {
  const buttons = skills.slice(0, 8).map(skill => ({
    text: `📚 Learn ${skill}`,
    callback_data: `learn_${skill.toLowerCase().replace(/\s+/g, '_').slice(0, 30)}`,
  }));

  // Split into rows of 2
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }

  rows.push([{ text: '🔄 New Scan', callback_data: 'new_scan' }]);

  return { reply_markup: { inline_keyboard: rows } };
}

// ── Cancel keyboard ──────────────────────────────────────
const cancelKeyboard = {
  reply_markup: {
    inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'cancel' }]],
  },
};

export { analysisKeyboard, actionKeyboard, skillsKeyboard, cancelKeyboard };