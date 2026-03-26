import 'dotenv/config';

export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default {
  TELEGRAM_TOKEN,
  GEMINI_API_KEY,
  OPENAI_API_KEY,
};