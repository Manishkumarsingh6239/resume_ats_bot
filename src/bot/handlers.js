// src/bot/handlers.js
import * as ai from '../ai/index.js';
import { parseFile, SUPPORTED_TYPES } from '../services/fileParser.js';
import { parsePDF, generatePDF } from '../services/pdf.js';
import { generateDOCX } from '../services/docx.js';
import { getSession, resetSession, checkLimit, incrementCount } from '../services/session.js';
import { analysisKeyboard, actionKeyboard, skillsKeyboard, cancelKeyboard } from './keyboards.js';
import MSG from './messages.js';

// ── Score bar renderer ───────────────────────────────────
function renderBar(score, total = 10) {
  const filled = Math.round(score);
  const empty = total - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` *${score}/${total}*`;
}

// ── Format full analysis message ─────────────────────────
function formatScore(result) {
  const score = result.score;
  let msg = `📊 *ATS Match Score*\n${renderBar(score.overall)}\n\n`;

  msg += `*Breakdown:*\n`;
  for (const cat of score.categories) {
    msg += `• ${cat.name}: ${renderBar(cat.score)}\n`;
  }
  msg += `\n_${score.reasoning}_\n\n`;

  const k = result.keywords?.map(i => `  • ${i}`).join('\n') || '  None';
  msg += `*🔑 Missing Keywords:*\n${k}\n\n`;

  const f = result.formatting?.map(i => `  • ${i}`).join('\n') || '  None';
  msg += `*📐 Formatting Issues:*\n${f}\n\n`;

  const c = result.content?.map(i => `  • ${i}`).join('\n') || '  None';
  msg += `*📝 Content Gaps:*\n${c}\n\n`;

  if (result.transitionRoadmap?.length) {
    msg += `*🚀 Transition Roadmap:*\n`;
    result.transitionRoadmap.forEach((r, i) => {
      msg += `${i + 1}. *${r.step}*\n   _${r.why}_\n`;
    });
    msg += '\n';
  }

  return msg;
}

// ── Format interview prep ────────────────────────────────
function formatInterview(questions) {
  let msg = `🎯 *Interview Prep — 5 Likely Questions*\n\n`;
  questions.forEach((q, i) => {
    msg += `*${i + 1}. ${q.question}*\n`;
    msg += `_Why asked:_ ${q.why}\n`;
    msg += `💡 _Tip:_ ${q.tip}\n\n`;
  });
  return msg;
}

// ── Format skill coaching ────────────────────────────────
function formatSkillPlan(plan) {
  let msg = `📚 *Learning Plan: ${plan.skill}*\n\n`;
  msg += `${plan.overview}\n\n`;
  msg += `*🗺️ Roadmap:*\n`;
  plan.roadmap.forEach((step, i) => { msg += `${i + 1}. ${step}\n`; });
  msg += `\n*📖 Resources:*\n`;
  plan.resources.forEach(r => { msg += `• [${r.title}](${r.url}) _(${r.type})_\n`; });
  msg += `\n⏱️ *Time estimate:* ${plan.timeEstimate}`;
  return msg;
}

// ── Split long messages ───────────────────────────────────
function splitMessage(text, maxLength = 4096) {
  if (text.length <= maxLength) return [text];
  const chunks = [];
  let current = '';
  for (const line of text.split('\n')) {
    if ((current + '\n' + line).length > maxLength) {
      chunks.push(current.trim());
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function sendLong(bot, chatId, text, options = {}) {
  const chunks = splitMessage(text);
  for (const chunk of chunks) {
    await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown', ...options });
  }
}

// ── Download file from Telegram ──────────────────────────
async function downloadFile(bot, fileId) {
  const file = await bot.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

// ── Process any incoming document ───────────────────────
async function handleDocument(bot, msg, session) {
  const chatId = msg.chat.id;
  const mimeType = msg.document.mime_type;

  if (!SUPPORTED_TYPES.includes(mimeType)) {
    return bot.sendMessage(chatId, MSG.UNSUPPORTED_FILE, { parse_mode: 'Markdown' });
  }

  const buffer = await downloadFile(bot, msg.document.file_id);
  let text;

  try {
    text = await parseFile(buffer, mimeType);
  } catch (err) {
    return bot.sendMessage(chatId, `❌ Could not read file: ${err.message}`);
  }

  if (session.step === 'awaiting_resume') {
    session.resumeText = text;
    session.editedText = text;
    session.step = 'awaiting_jd';
    bot.sendMessage(chatId, MSG.ASK_JD, { parse_mode: 'Markdown' });

  } else if (session.step === 'awaiting_jd') {
    session.jdText = text;
    await runScan(bot, chatId, session);

  } else {
    bot.sendMessage(chatId, '⚠️ Send /start to begin a new scan.');
  }
}

// ── Main scan ────────────────────────────────────────────
async function runScan(bot, chatId, session) {
  // Rate limit check
  const { allowed, remaining } = checkLimit(chatId);
  if (!allowed) {
    return bot.sendMessage(chatId, MSG.RATE_LIMIT, { parse_mode: 'Markdown' });
  }

  await bot.sendMessage(chatId, MSG.SCANNING, { parse_mode: 'Markdown' });
  bot.sendChatAction(chatId, 'typing');
  session.step = 'processing';

  try {
    const result = await ai.score(session.resumeText, session.jdText);
    session.lastScore = result;
    session.optimizedResume = result.optimizedResume;
    session.editedText = JSON.stringify(result.optimizedResume);
    session.tweakCount = 0;
    session.step = 'ready';

    incrementCount(chatId);

    // Send score analysis
    await sendLong(bot, chatId, formatScore(result), { parse_mode: 'Markdown' });

    // Send skills to practice as buttons
    const skills = result.skillsToPractice?.map(s => s.skill) || [];
    if (skills.length > 0) {
      await bot.sendMessage(chatId,
        `📚 *Skills to Practice:*\n${skills.map(s => `• ${s}`).join('\n')}\n\n_Tap a button below to get a learning plan for any skill:_`,
        { parse_mode: 'Markdown', ...skillsKeyboard(skills) }
      );
    }

    // Send optimized resume options
    await bot.sendMessage(chatId,
      `✅ *Optimized Resume Ready!*\n_${remaining - 1} analyses remaining today_`,
      { parse_mode: 'Markdown', ...analysisKeyboard }
    );

  } catch (err) {
    console.error('Scan error:', err);
    session.step = 'awaiting_resume';
    bot.sendMessage(chatId, MSG.ERROR, { parse_mode: 'Markdown' });
  }
}

// ── Register all handlers ─────────────────────────────────
function register(bot) {

  // /start
  bot.onText(/\/start/, (msg) => {
    resetSession(msg.chat.id);
    bot.sendMessage(msg.chat.id, MSG.WELCOME, { parse_mode: 'Markdown' });
  });

  // /reset
  bot.onText(/\/reset/, (msg) => {
    resetSession(msg.chat.id);
    bot.sendMessage(msg.chat.id, MSG.RESET_DONE, { parse_mode: 'Markdown' });
  });

  // /cancel
  bot.onText(/\/cancel/, (msg) => {
    resetSession(msg.chat.id);
    bot.sendMessage(msg.chat.id, MSG.CANCEL, { parse_mode: 'Markdown' });
  });

  // Documents (PDF, DOCX, images)
  bot.on('document', async (msg) => {
    const session = getSession(msg.chat.id);
    await handleDocument(bot, msg, session);
  });

  // Photos (JPG/PNG sent as photo not document)
  bot.on('photo', async (msg) => {
    const session = getSession(msg.chat.id);
    const photo = msg.photo[msg.photo.length - 1]; // highest resolution
    const buffer = await downloadFile(bot, photo.file_id);

    try {
      const text = await parseFile(buffer, 'image/jpeg');
      if (session.step === 'awaiting_resume') {
        session.resumeText = text;
        session.editedText = text;
        session.step = 'awaiting_jd';
        bot.sendMessage(msg.chat.id, MSG.ASK_JD, { parse_mode: 'Markdown' });
      } else if (session.step === 'awaiting_jd') {
        session.jdText = text;
        await runScan(bot, msg.chat.id, session);
      }
    } catch (err) {
      bot.sendMessage(msg.chat.id, `❌ Could not read image: ${err.message}`);
    }
  });

  // Text messages
  bot.on('message', async (msg) => {
    if (msg.document || msg.photo || msg.text?.startsWith('/')) return;
    const session = getSession(msg.chat.id);
    const text = msg.text?.trim();
    if (!text) return;

    // Free text skill coaching — e.g. "teach me Docker"
    if (session.step === 'ready' && /teach|learn|how to|guide|tutorial|course/i.test(text)) {
      const skillMatch = text.replace(/teach me|learn|how to|guide|tutorial|course for/gi, '').trim();
      if (skillMatch.length > 1) {
        await handleSkillCoach(bot, msg.chat.id, session, skillMatch);
        return;
      }
    }

    if (session.step === 'awaiting_resume') {
      // Plain text resume
      session.resumeText = text;
      session.editedText = text;
      session.step = 'awaiting_jd';
      bot.sendMessage(msg.chat.id, MSG.ASK_JD, { parse_mode: 'Markdown' });

    } else if (session.step === 'awaiting_jd') {
      session.jdText = text;
      await runScan(bot, msg.chat.id, session);

    } else if (session.step === 'editing') {
      if (session.tweakCount >= 5) {
        return bot.sendMessage(msg.chat.id,
          `⚠️ *Maximum 5 edits reached.*\nDownload your resume or start a new scan.`,
          { parse_mode: 'Markdown', ...actionKeyboard }
        );
      }
      bot.sendChatAction(msg.chat.id, 'typing');
      session.editedText = await ai.edit(session.editedText, text);
      session.tweakCount += 1;
      session.step = 'ready';
      bot.sendMessage(msg.chat.id,
        `${MSG.EDIT_DONE}\n_Edit ${session.tweakCount}/5 used_`,
        { parse_mode: 'Markdown', ...actionKeyboard }
      );
    }
  });

  // Callback buttons
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const session = getSession(chatId);
    const data = query.data;
    bot.answerCallbackQuery(query.id);

    // ── Downloads ──────────────────────────────────────
    if (data === 'dl_pdf') {
      bot.sendChatAction(chatId, 'upload_document');
      const buf = await generatePDF(session.optimizedResume || session.editedText);
      bot.sendDocument(chatId, buf, {}, { filename: 'optimized_resume.pdf', contentType: 'application/pdf' });

    } else if (data === 'dl_docx') {
      bot.sendChatAction(chatId, 'upload_document');
      const buf = await generateDOCX(session.optimizedResume || session.editedText);
      bot.sendDocument(chatId, buf, {}, {
        filename: 'optimized_resume.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    // ── Edit ───────────────────────────────────────────
    } else if (data === 'edit') {
      session.step = 'editing';
      bot.sendMessage(chatId, MSG.ASK_EDIT, { parse_mode: 'Markdown', ...cancelKeyboard });

    // ── Cover letter ───────────────────────────────────
    } else if (data === 'cover_letter') {
      await handleCoverLetter(bot, chatId, session);

    } else if (data === 'dl_cover_pdf') {
      bot.sendChatAction(chatId, 'upload_document');
      const buf = await generatePDF(session.coverLetter);
      bot.sendDocument(chatId, buf, {}, { filename: 'cover_letter.pdf', contentType: 'application/pdf' });

    } else if (data === 'dl_cover_docx') {
      bot.sendChatAction(chatId, 'upload_document');
      const buf = await generateDOCX(session.coverLetter);
      bot.sendDocument(chatId, buf, {}, {
        filename: 'cover_letter.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    // ── Interview prep ─────────────────────────────────
    } else if (data === 'interview_prep') {
      await handleInterviewPrep(bot, chatId, session);

    // ── Skill coaching (buttons) ───────────────────────
    } else if (data.startsWith('learn_')) {
      const skillName = data.replace('learn_', '').replace(/_/g, ' ');
      await handleSkillCoach(bot, chatId, session, skillName);

    // ── Cancel ─────────────────────────────────────────
    } else if (data === 'cancel') {
      session.step = 'ready';
      bot.sendMessage(chatId, '❌ Cancelled.', { parse_mode: 'Markdown', ...analysisKeyboard });

    // ── New scan ───────────────────────────────────────
    } else if (data === 'new_scan') {
      resetSession(chatId);
      bot.sendMessage(chatId, MSG.WELCOME, { parse_mode: 'Markdown' });
    }
  });
}

// ── Cover letter handler ──────────────────────────────────
async function handleCoverLetter(bot, chatId, session) {
  if (!session.optimizedResume || !session.jdText) {
    return bot.sendMessage(chatId, '⚠️ Please run a scan first.');
  }
  await bot.sendMessage(chatId, MSG.GENERATING_COVER, { parse_mode: 'Markdown' });
  bot.sendChatAction(chatId, 'typing');

  try {
    const letter = await ai.coverLetter(session.jdText, session.optimizedResume);
    session.coverLetter = letter;
    await sendLong(bot, chatId, `💌 *Your Cover Letter:*\n\n${letter}`, { parse_mode: 'Markdown' });
    await bot.sendMessage(chatId, 'Download your cover letter:', {
      reply_markup: {
        inline_keyboard: [[
          { text: '📄 PDF', callback_data: 'dl_cover_pdf' },
          { text: '📝 DOCX', callback_data: 'dl_cover_docx' },
        ]],
      },
    });
  } catch (err) {
    console.error('Cover letter error:', err);
    bot.sendMessage(chatId, MSG.ERROR, { parse_mode: 'Markdown' });
  }
}

// ── Interview prep handler ────────────────────────────────
async function handleInterviewPrep(bot, chatId, session) {
  if (!session.optimizedResume || !session.jdText) {
    return bot.sendMessage(chatId, '⚠️ Please run a scan first.');
  }
  await bot.sendMessage(chatId, MSG.GENERATING_INTERVIEW, { parse_mode: 'Markdown' });
  bot.sendChatAction(chatId, 'typing');

  try {
    const questions = await ai.interviewPrep(session.jdText, session.optimizedResume);
    session.interviewPrep = questions;
    await sendLong(bot, chatId, formatInterview(questions), { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Interview prep error:', err);
    bot.sendMessage(chatId, MSG.ERROR, { parse_mode: 'Markdown' });
  }
}

// ── Skill coach handler ───────────────────────────────────
async function handleSkillCoach(bot, chatId, session, skillName) {
  if (!session.jdText) {
    return bot.sendMessage(chatId, '⚠️ Please run a scan first so I have job context.');
  }
  await bot.sendMessage(chatId, MSG.LEARNING_PLAN, { parse_mode: 'Markdown' });
  bot.sendChatAction(chatId, 'typing');

  try {
    const jobContext = session.jdText.slice(0, 200); // brief context
    const plan = await ai.skillCoach(skillName, jobContext);
    await sendLong(bot, chatId, formatSkillPlan(plan), {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.error('Skill coach error:', err);
    bot.sendMessage(chatId, MSG.ERROR, { parse_mode: 'Markdown' });
  }
}

export { register };