require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { TELEGRAM_TOKEN } = require('../config');
const { register } = require('./handlers');

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
register(bot);

console.log('Bot is running...');