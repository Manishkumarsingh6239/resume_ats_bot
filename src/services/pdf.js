const pdfParse = require('pdf-parse');
const { PDFDocument, StandardFonts } = require('pdf-lib');

async function parsePDF(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}

async function generatePDF(text) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const lines = text.split('\n');
  let y = height - 40;
  for (const line of lines) {
    if (y < 40) break;
    page.drawText(line.slice(0, 90), { x: 40, y, size: 10, font });
    y -= 14;
  }
  return Buffer.from(await pdfDoc.save());
}

module.exports = { parsePDF, generatePDF };