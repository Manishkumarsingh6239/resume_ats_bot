// src/services/docx.js
import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, AlignmentType, BorderStyle,
} from 'docx';

async function generateDOCX(resumeJSON) {
  // Parse resumeJSON — handle both string and object
  let resume = resumeJSON;
  if (typeof resumeJSON === 'string') {
    try { resume = JSON.parse(resumeJSON); } catch { resume = null; }
  }

  // Fallback: plain paragraphs if not structured
  if (!resume || typeof resume !== 'object') {
    const doc = new Document({
      sections: [{
        children: String(resumeJSON).split('\n').map(line => new Paragraph(line)),
      }],
    });
    return await Packer.toBuffer(doc);
  }

  const children = [];

  // ── NAME ────────────────────────────────────────────────
  if (resume.name) {
    children.push(new Paragraph({
      children: [new TextRun({ text: resume.name, bold: true, size: 36, color: '1A1A2E' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }));
  }

  // ── CONTACT ─────────────────────────────────────────────
  if (resume.contact) {
    children.push(new Paragraph({
      children: [new TextRun({ text: resume.contact, size: 18, color: '555555' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));
  }

  // Helper — section header with bottom border
  function sectionHeader(title) {
    return new Paragraph({
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, color: '26589E' })],
      spacing: { before: 300, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '26589E' } },
    });
  }

  // ── SUMMARY ─────────────────────────────────────────────
  if (resume.summary) {
    children.push(sectionHeader('Professional Summary'));
    children.push(new Paragraph({
      children: [new TextRun({ text: resume.summary, size: 20 })],
      spacing: { after: 100 },
    }));
  }

  // ── EXPERIENCE ──────────────────────────────────────────
  if (resume.experience?.length) {
    children.push(sectionHeader('Experience'));
    for (const exp of resume.experience) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.title, bold: true, size: 22 }),
          new TextRun({ text: ` — ${exp.company}`, size: 22 }),
        ],
        spacing: { before: 150, after: 40 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: exp.duration, size: 18, color: '777777', italics: true })],
        spacing: { after: 80 },
      }));
      for (const bullet of (exp.bullets || [])) {
        children.push(new Paragraph({
          children: [new TextRun({ text: bullet, size: 20 })],
          bullet: { level: 0 },
          spacing: { after: 40 },
        }));
      }
    }
  }

  // ── SKILLS ──────────────────────────────────────────────
  if (resume.skills?.length) {
    children.push(sectionHeader('Skills'));
    children.push(new Paragraph({
      children: [new TextRun({ text: resume.skills.join(' • '), size: 20 })],
      spacing: { after: 100 },
    }));
  }

  // ── EDUCATION ───────────────────────────────────────────
  if (resume.education?.length) {
    children.push(sectionHeader('Education'));
    for (const edu of resume.education) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: edu.degree, bold: true, size: 22 }),
          new TextRun({ text: ` — ${edu.institution} (${edu.year})`, size: 20 }),
        ],
        spacing: { after: 80 },
      }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}

export { generateDOCX };