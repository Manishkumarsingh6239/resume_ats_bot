// src/bot/messages.js
export default {
  WELCOME:
    `👋 *Welcome to Resume ATS Bot!*\n\n` +
    `I'll help you:\n` +
    `• 📊 Score your resume against any job description\n` +
    `• ✨ Generate an optimized, ATS-ready resume\n` +
    `• 💌 Write a tailored cover letter\n` +
    `• 🎯 Prepare interview questions\n` +
    `• 📚 Learn missing skills with curated resources\n\n` +
    `*Step 1/2* — Send me your resume\n` +
    `_(PDF, DOCX, image, or paste as text)_`,

  ASK_JD:
    `✅ *Resume received!*\n\n` +
    `*Step 2/2* — Now send me the *job description*\n` +
    `_(paste as text, or upload PDF/DOCX)_`,

  SCANNING:
    `⏳ *Analyzing your resume...*\n` +
    `_This usually takes 15–30 seconds_`,

  ASK_EDIT:
    `✏️ *What would you like to change?*\n\n` +
    `Examples:\n` +
    `• "Make it more concise"\n` +
    `• "Emphasize leadership skills"\n` +
    `• "Add more quantified achievements"`,

  EDIT_DONE:
    `✅ *Resume updated!*\n` +
    `Use the buttons below to download or keep editing.`,

  RESET_DONE:
    `🔄 Session cleared! Send your resume to start again.`,

  CANCEL:
    `❌ *Cancelled.* Send /start to begin again.`,

  RATE_LIMIT:
    `⚠️ *Daily limit reached!*\n` +
    `You've used your 3 free analyses today.\n` +
    `Come back tomorrow! 🌅`,

  ERROR:
    `❌ *Something went wrong.* Please try again.\n` +
    `If the issue persists, send /start to reset.`,

  UNSUPPORTED_FILE:
    `⚠️ *Unsupported file type.*\n` +
    `Please send a *PDF, DOCX, image (JPG/PNG)*, or paste as text.`,

  GENERATING_COVER:
    `💌 *Generating your cover letter...*`,

  GENERATING_INTERVIEW:
    `🎯 *Preparing interview questions...*`,

  LEARNING_PLAN:
    `📚 *Building your learning plan...*`,
};