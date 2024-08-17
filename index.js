const express = require("express");
const apps = express();
const fs = require('fs');
require("dotenv").config();


const getBotInstance = require('./botInstance');
const bot = getBotInstance();


bot.setMyCommands([
    { command: '/start ', description: 'Start interacting with the bot' },
    { command: '/setting ', description: 'Adjust your settings' },
    { command: '/stop ', description: 'stop your bot' },
    { command: '/setchannel ', description: 'Set Source and Destination Channel IDs' },
    { command: '/message_start ' , description: 'Set the message to start from' },
    { command: '/update_source_channel ' , description: 'Update the source channel' },
    { command: '/update_message_from ' , description: 'Update the mesageID from start' },
    { command: '/update_destination_channel ' , description: 'Update the destination channel' },
    { command: '/video_forwarding ' , description: 'Enable/Disable video forwarding' },
    { command: '/audio_forwarding ' , description: 'Enable/Disable audio forwarding' },
    { command: '/photo_forwarding ' , description: 'Enable/Disable photo forwarding' },
    { command: '/document_forwarding ' , description: 'Enable/Disable document forwarding' },
    { command: '/stickers_forwarding ' , description: 'Enable/Disable stickers forwarding' },
    { command: '/gif_forwarding ' , description: 'Enable/Disable gif forwarding' },
]);

let sourceChannelID = process.env.SOURCE_CHANNEL_ACCESS_ID;
let destinationChannelID = process.env.DESTINATION_CHANNEL_ACCESS_ID;

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat?.id;
    console.log("Received /start command from chatId:", chatId);

    if (!chatId) {
        console.error("chatId is undefined or null");
        return;
    }

    updateEnvVariable('USERID', chatId);

    if (!sourceChannelID || !destinationChannelID) {
        bot.sendMessage(chatId, `*Please Enter SourceChannelID and DestinationChannelID using* \`/setchannel 'sourcechannelid' 'destinationchannelid'\` *command*`, { parse_mode: 'MarkdownV2' });
    } else {
        bot.sendMessage(chatId, `*Bot is ready\\. SourceChannelID: ${sourceChannelID}, DestinationChannelID: ${destinationChannelID}*`, { parse_mode: 'MarkdownV2' });
        const { app } = require("./src/app.js");
        const auth = require('./src/file/auth.forward.js');
    }
});


bot.onText(/\/setchannel (.+)/, (msg, match) => {
    const chatId = msg.chat?.id;
    console.log("Received /setchannel command from chatId:", chatId);

    if (!chatId) {
        console.error("chatId is undefined or null");
        return;
    }

    try {
        const channels = match[1].match(/'(\d+)' '(\d+)'/);
        if (!channels) {
            throw new Error("Invalid format. Please use the format: /setchannel 'SourceChannelID' 'DestinationChannelID'");
        } else if (sourceChannelID && destinationChannelID) {
            bot.sendMessage(chatId, `*Source and Destination Channel IDs are already set* \`${sourceChannelID} ${destinationChannelID}\``, { parse_mode: 'MarkdownV2' });
            return;
        }

        sourceChannelID = channels[1];
        destinationChannelID = channels[2];
        console.log(`Channel IDs received: ${sourceChannelID}, ${destinationChannelID}`);

        updateEnvVariable('SOURCE_CHANNEL_ACCESS_ID', sourceChannelID);
        updateEnvVariable('DESTINATION_CHANNEL_ACCESS_ID', destinationChannelID);

        bot.sendMessage(
            chatId,
            `*Channels set to:* sourceChannelID: \`${sourceChannelID}\`, destinationChannelID: \`${destinationChannelID}\``,
            { parse_mode: 'MarkdownV2' }
        );

        // Execute your required logic here
        if (sourceChannelID && destinationChannelID) {
            const { app } = require("./src/app.js");
            const auth = require('./src/file/auth.forward.js');
            console.log("Source and Destination Channel IDs are set. Executing auth.forward.js.");
        } else {
            console.log("Source and Destination Channel IDs are not set. Skipping the execution of auth.forward.js.");
        }

    } catch (error) {
        bot.sendMessage(chatId, error.message);
    }
});

function updateEnvVariable(key, value) {
    const envFilePath = './.env';
    const envFileContent = fs.readFileSync(envFilePath, 'utf8');
    const envLines = envFileContent.split('\n');

    const updatedEnvLines = envLines.map(line => {
        const [currentKey] = line.split('=');
        if (currentKey === key) {
            return `${key}=${value}`;
        }
        return line;
    });

    fs.writeFileSync(envFilePath, updatedEnvLines.join('\n'), 'utf8');
};


apps.get("/", (req, res) => {
    res.status(200).json({
        name: "vishal",
        class: 12,
        roll: "2ADDHDH&^&"
    });
});
