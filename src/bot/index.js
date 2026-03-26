import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_TOKEN } from '../config/index.js';
import { register } from './handlers.js';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
register(bot);

console.log('Bot is running...');