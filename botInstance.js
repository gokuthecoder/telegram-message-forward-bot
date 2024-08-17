const TelegramBot = require('node-telegram-bot-api');
let bot;

const getBotInstance = () => {
    if (!bot) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        bot = new TelegramBot(token, { polling: true });
    }
    return bot;
};


module.exports = getBotInstance;
