// src/bot/index.js
import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_TOKEN } from '../config/index.js';
import { register } from './handlers.js';

// ✅ Define bot FIRST
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// ✅ Register handlers
register(bot);

console.log('Bot is running...');

// ✅ No bot.launch() — that's Telegraf only, node-telegram-bot-api doesn't use it
// Polling starts automatically when you pass { polling: true } above

process.once("SIGINT", () => {
  console.log("Stopping bot...");
  bot.stopPolling();
});

process.once("SIGTERM", () => {
  console.log("Stopping bot...");
  bot.stopPolling();
});