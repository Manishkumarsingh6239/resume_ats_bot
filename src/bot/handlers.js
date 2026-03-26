import * as ai from '../ai/index.js';
import { parsePDF, generatePDF } from '../services/pdf.js';
import { generateDOCX } from '../services/docx.js';
import { getSession, resetSession } from '../services/session.js';
import { actionKeyboard } from './keyboards.js';
import MSG from './messages.js';

function formatScore(result) {
  const k = result.keywords.map(i => `  • ${i}`).join('\n') || '  None';
  const f = result.formatting.map(i => `  • ${i}`).join('\n') || '  None';
  const c = result.content.map(i => `  • ${i}`).join('\n') || '  None';
  return `*ATS Score: ${result.score}/10*\n_${result.reason}_\n\n` +
    `*Missing Keywords:*\n${k}\n\n` +
    `*Formatting Issues:*\n${f}\n\n` +
    `*Content Gaps:*\n${c}`;
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
      bot.sendDocument(chatId, buf, {}, { filename: 'resume_updated.pdf', contentType: 'application/pdf' });

    } else if (query.data === 'dl_docx') {
      bot.sendChatAction(chatId, 'upload_document');
      const buf = await generateDOCX(session.editedText);
      bot.sendDocument(chatId, buf, {}, {
        filename: 'resume_updated.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    }
  });
}

async function runScan(bot, chatId, session) {
  bot.sendMessage(chatId, MSG.SCANNING);
  bot.sendChatAction(chatId, 'typing');
  session.step = 'ready';
  const result = await ai.score(session.resumeText, session.jdText);
  session.lastScore = result;
  bot.sendMessage(chatId, formatScore(result), { parse_mode: 'Markdown', ...actionKeyboard });
}

export { register };