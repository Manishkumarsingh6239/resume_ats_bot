// src/services/fileParser.js
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config/index.js';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SUPPORTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/webp',
];

async function parseFile(buffer, mimeType) {
  switch (mimeType) {
    case 'application/pdf':
      return await parsePDF(buffer);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await parseDOCX(buffer);

    case 'text/plain':
    case 'text/markdown':
      return buffer.toString('utf-8');

    case 'image/jpeg':
    case 'image/png':
    case 'image/webp':
      return await parseImageWithVision(buffer, mimeType);

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

async function parsePDF(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();
    const text = data.text?.trim();

    // If scanned PDF (no text layer), use Gemini Vision
    if (!text || text.length < 50) {
      return await parseImageWithVision(buffer, 'image/jpeg');
    }

    return text;
  } catch {
    throw new Error('Could not read PDF. Try sending it as an image or paste as text.');
  }
}

async function parseDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

async function parseImageWithVision(buffer, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const base64 = buffer.toString('base64');
  const imagePart = {
    inlineData: {
      data: base64,
      mimeType: mimeType === 'application/pdf' ? 'image/jpeg' : mimeType,
    },
  };

  const result = await model.generateContent([
    imagePart,
    'Extract ALL text from this document exactly as it appears. Return only the raw text, no commentary.',
  ]);

  return result.response.text().trim();
}

export { parseFile, SUPPORTED_TYPES };