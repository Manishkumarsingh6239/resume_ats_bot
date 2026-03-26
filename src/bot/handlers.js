// src/bot/handlers.js
import * as ai from '../ai/index.js';
import { parsePDF, generatePDF } from '../services/pdf.js';
import { generateDOCX } from '../services/docx.js';
import { getSession, resetSession } from '../services/session.js';
import { actionKeyboard } from './keyboards.js';
import MSG from './messages.js';

// ✅ Score bar renderer — e.g. ████████░░ 8/10
function renderBar(score, total = 10) {
  const filled = Math.round(score);
  const empty = total - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` *${score}/${total}*`;
}

// ✅ Full score message with bar + breakdown + roadmap + skills
function formatScore(result) {
  const score = result.score;

  // Overall bar
  let msg = `📊 *ATS Match Score*\n${renderBar(score.overall)}\n\n`;

  // Category breakdown
  msg += `*Breakdown:*\n`;
  for (const cat of score.categories) {
    msg += `• ${cat.name}: ${renderBar(cat.score)}\n`;
  }
  msg += `\n_${score.reasoning}_\n\n`;

  // Missing keywords
  const k = result.keywords.map(i => `  • ${i}`).join('\n') || '  None';
  msg += `*🔑 Missing Keywords:*\n${k}\n\n`;

  // Formatting issues
  const f = result.formatting.map(i => `  • ${i}`).join('\n') || '  None';
  msg += `*📐 Formatting Issues:*\n${f}\n\n`;

  // Content gaps
  const c = result.content.map(i => `  • ${i}`).join('\n') || '  None';
  msg += `*📝 Content Gaps:*\n${c}\n\n`;

  // Transition roadmap
  if (result.transitionRoadmap?.length) {
    msg += `*🚀 Transition Roadmap:*\n`;
    result.transitionRoadmap.forEach((r, i) => {
      msg += `${i + 1}. *${r.step}*\n   _${r.why}_\n`;
    });
    msg += '\n';
  }

  // Skills to practice
  if (result.skillsToPractice?.length) {
    msg += `*📚 Skills to Practice:*\n`;
    result.skillsToPractice.forEach(s => {
      msg += `• *${s.skill}*: ${s.gap}\n  👉 ${s.resource}\n`;
    });
  }

  return msg;
}

// ✅ Split long messages (Telegram limit is 4096 chars)
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

async function downloadFile(bot, fileId) {
  const file = await bot.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

function register(bot) {

  bot.onText(/\/start/, (msg) => {
    resetSession(msg.chat.id);
    bot.sendMessage(msg.chat.id, MSG.WELCOME, { parse_mode: 'Markdown' });
  });

  bot.onText(/\/reset/, (msg) => {
    resetSession(msg.chat.id);
    bot.sendMessage(msg.chat.id, MSG.RESET_DONE);
  });

  bot.on('document', async (msg) => {
    const session = getSession(msg.chat.id);
    const buffer = await downloadFile(bot, msg.document.file_id);
    const text = await parsePDF(buffer);

    if (session.step === 'awaiting_resume') {
      session.resumeText = text;
      session.editedText = text;
      session.step = 'awaiting_jd';
      bot.sendMessage(msg.chat.id, MSG.ASK_JD, { parse_mode: 'Markdown' });

    } else if (session.step === 'awaiting_jd') {
      session.jdText = text;
      await runScan(bot, msg.chat.id, session);
    }
  });

  bot.on('message', async (msg) => {
    if (msg.document || msg.text?.startsWith('/')) return;
    const session = getSession(msg.chat.id);
    const text = msg.text?.trim();
    if (!text) return;

    if (session.step === 'awaiting_jd') {
      session.jdText = text;
      await runScan(bot, msg.chat.id, session);

    } else if (session.step === 'editing') {
      bot.sendChatAction(msg.chat.id, 'typing');
      session.editedText = await ai.edit(session.editedText, text);
      session.step = 'ready';
      bot.sendMessage(msg.chat.id, MSG.EDIT_DONE, actionKeyboard);
    }
  });

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const session = getSession(chatId);
    bot.answerCallbackQuery(query.id);

    if (query.data === 'edit') {
      session.step = 'editing';
      bot.sendMessage(chatId, MSG.ASK_EDIT);

    } else if (query.data === 'dl_pdf') {
      bot.sendChatAction(chatId, 'upload_document');
      const buf = await generatePDF(session.editedText);
      bot.sendDocument(chatId, buf, {}, {
        filename: 'resume_updated.pdf',
        contentType: 'application/pdf',
      });

    } else if (query.data === 'dl_docx') {
      bot.sendChatAction(chatId, 'upload_document');
      const buf = await generateDOCX(session.editedText);
      bot.sendDocument(chatId, buf, {}, {
        filename: 'resume_updated.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    // ✅ New: download optimized resume
    } else if (query.data === 'dl_optimized_pdf') {
      bot.sendChatAction(chatId, 'upload_document');
      const buf = await generatePDF(session.optimizedResume);
      bot.sendDocument(chatId, buf, {}, {
        filename: 'optimized_resume.pdf',
        contentType: 'application/pdf',
      });

    } else if (query.data === 'dl_optimized_docx') {
      bot.sendChatAction(chatId, 'upload_document');
      const buf = await generateDOCX(session.optimizedResume);
      bot.sendDocument(chatId, buf, {}, {
        filename: 'optimized_resume.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    }
  });
}

async function runScan(bot, chatId, session) {
  await bot.sendMessage(chatId, MSG.SCANNING);
  bot.sendChatAction(chatId, 'typing');

  const result = await ai.score(session.resumeText, session.jdText);
  session.lastScore = result;
  session.optimizedResume = result.optimizedResume; // ✅ save optimized resume
  session.editedText = result.optimizedResume;       // ✅ make it editable too
  session.step = 'ready';

  // Send score + analysis (split if too long)
  await sendLong(bot, chatId, formatScore(result), { parse_mode: 'Markdown' });

  // ✅ Send optimized resume as separate message with download buttons
  await bot.sendMessage(chatId,
    `✅ *Optimized Resume Ready!*\nChoose a format to download:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📄 Download PDF', callback_data: 'dl_optimized_pdf' },
            { text: '📝 Download DOCX', callback_data: 'dl_optimized_docx' },
          ],
          [
            { text: '✏️ Edit Resume', callback_data: 'edit' },
          ]
        ]
      }
    }
  );
}

export { register };