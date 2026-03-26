// src/services/pdf.js
import { PDFParse } from 'pdf-parse';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ✅ Fixed import — was crashing before
async function parsePDF(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const data = await parser.getText();
    return data.text?.trim() || '';
  } finally {
    await parser.destroy();
  }
}

// ✅ Beautiful styled PDF with sections, dividers, proper layout
async function generatePDF(resumeJSON) {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const pageWidth = 595;
  const pageHeight = 842;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function addPage() {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  function checkSpace(needed = 20) {
    if (y < margin + needed) addPage();
  }

  function drawText(text, { size = 10, font = regularFont, color = rgb(0.1, 0.1, 0.1), indent = 0 } = {}) {
    checkSpace(size + 6);
    const maxChars = Math.floor((contentWidth - indent) / (size * 0.55));
    const words = String(text).split(' ');
    let line = '';

    for (const word of words) {
      if ((line + word).length > maxChars) {
        page.drawText(line.trim(), { x: margin + indent, y, size, font, color });
        y -= size + 4;
        checkSpace(size + 4);
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line.trim()) {
      page.drawText(line.trim(), { x: margin + indent, y, size, font, color });
      y -= size + 4;
    }
  }

  function drawSectionHeader(title) {
    checkSpace(30);
    y -= 8;
    drawText(title.toUpperCase(), { size: 11, font: boldFont, color: rgb(0.15, 0.35, 0.65) });
    // Divider line
    page.drawLine({
      start: { x: margin, y: y + 2 },
      end: { x: pageWidth - margin, y: y + 2 },
      thickness: 0.8,
      color: rgb(0.15, 0.35, 0.65),
    });
    y -= 6;
  }

  function drawBullet(text) {
    checkSpace(16);
    page.drawText('•', { x: margin + 8, y, size: 10, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    drawText(text, { indent: 20 });
  }

  // Parse resumeJSON — handle both string and object
  let resume = resumeJSON;
  if (typeof resumeJSON === 'string') {
    try { resume = JSON.parse(resumeJSON); } catch { resume = null; }
  }

  // Fallback: plain text PDF if not structured
  if (!resume || typeof resume !== 'object') {
    const lines = String(resumeJSON).split('\n');
    for (const line of lines) drawText(line);
    return Buffer.from(await pdfDoc.save());
  }

  // ── NAME & CONTACT ──────────────────────────────────────
  if (resume.name) {
    drawText(resume.name, { size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 2;
  }
  if (resume.contact) {
    drawText(resume.contact, { size: 9, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 6;

  // ── SUMMARY ─────────────────────────────────────────────
  if (resume.summary) {
    drawSectionHeader('Professional Summary');
    drawText(resume.summary);
    y -= 4;
  }

  // ── EXPERIENCE ──────────────────────────────────────────
  if (resume.experience?.length) {
    drawSectionHeader('Experience');
    for (const exp of resume.experience) {
      checkSpace(40);
      drawText(`${exp.title} — ${exp.company}`, { font: boldFont, size: 10 });
      drawText(exp.duration, { size: 9, color: rgb(0.5, 0.5, 0.5) });
      for (const bullet of (exp.bullets || [])) drawBullet(bullet);
      y -= 4;
    }
  }

  // ── SKILLS ──────────────────────────────────────────────
  if (resume.skills?.length) {
    drawSectionHeader('Skills');
    drawText(resume.skills.join('  •  '));
    y -= 4;
  }

  // ── EDUCATION ───────────────────────────────────────────
  if (resume.education?.length) {
    drawSectionHeader('Education');
    for (const edu of resume.education) {
      drawText(`${edu.degree} — ${edu.institution} (${edu.year})`, { font: boldFont, size: 10 });
    }
  }

  return Buffer.from(await pdfDoc.save());
}

export { parsePDF, generatePDF };