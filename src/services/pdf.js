import { PDFParse } from 'pdf-parse';
import { PDFDocument, StandardFonts } from 'pdf-lib';

async function parsePDF(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
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

export { parsePDF, generatePDF };