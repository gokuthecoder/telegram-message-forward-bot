const fs = require("fs");
const path = require("path");
const input = require("input");
const dotenv = require("dotenv");
const { Api, TelegramClient } = require("telegram");
const TelegramBot = require('node-telegram-bot-api');
const { StringSession } = require("telegram/sessions");
dotenv.config();

const getBotInstance = require('../../botInstance.js');
const e = require("express");
const bot = getBotInstance();

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const USERID = process.env.USERID;
const userID = USERID;
const stringSession = new StringSession(process.env.SESSION_STRING);

const Source_Channel_ID = process.env.SOURCE_CHANNEL_ACCESS_ID;
const DESTINATION_CHANNEL_ACCESS_ID = process.env.DESTINATION_CHANNEL_ACCESS_ID;

let commandsUpdated = false;  // Flag to track if commands were updated
let restartFlag = false; // Flag to trigger a restart
const start = process.env.MESSAGE_START_FROM;
let element = start;
let cuurentMessageDetails;

bot.onText(/\/setting/, (msg) => {
    const chatId = msg.chat.id;

    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'About', url: 'https://telegra.ph/BOT-COMMAND-FORWARDING-CHANNEL-08-10/' }, // Telegraf link
                    { text: 'Current MessageID', callback_data: 'current_message_id' }
                ],
                [
                    { text: 'Show .env', callback_data: 'show_env' } // New button
                ]
            ]
        }
    };

    bot.sendMessage(chatId, 'Choose an option:', options);
});

bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;

    if (data === 'current_message_id') {
        // Respond with the current message ID details
        if (!cuurentMessageDetails) {
            bot.sendMessage(message.chat.id, `\`The current message ID is: ${element}\``, { parse_mode: 'MarkdownV2' });
        } 
    } else if (data === 'show_env') {
        // Read the .env file and send its contents
        fs.readFile('./.env', 'utf8', (err, data) => {
            if (err) {
                bot.sendMessage(message.chat.id, `Error reading .env file: ${err.message}`);
                return;
            }
            // Send the .env file content in monospaced and quoted style
            bot.sendMessage(message.chat.id, `\`\`\`\n${data}\n\`\`\``, { parse_mode: 'MarkdownV2' });
        });
    } else {
        // bot.sendMessage(message.chat.id, `\`You pressed ${data}\``, { parse_mode: 'MarkdownV2' });

    }
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    if (commandsUpdated) {
        bot.sendMessage(chatId, 'Restarting the application due to recent updates...').then(res => {
            process.exit();
        }).catch(err => {
            console.log(err.message);
        });
    } else {
        bot.sendMessage(chatId, 'Bot is ready.');
    }
});


bot.onText(/\/stop/, (msg) => {
    const chatId = msg.chat.id;
    console.log("Stopping the bot...");
    bot.sendMessage(chatId, 'Bot is stopping. Please use /start to restart.')
        .then(() => {
            commandsUpdated = true;  // Set flag to true for restart
            // Wait for pending messages to be sent
            setTimeout(() => {
                process.exit();
            }, 5000);  // Adjust timeout as needed
        })
        .catch((error) => {
            console.error("Failed to send stop message:", error);
            process.exit(1);  // Exit with an error code if sending fails
        });
});


bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;

    // bot.sendMessage(message.chat.id, `\`You pressed ${data}\``, { parse_mode: 'MarkdownV2' });
});

bot.onText(/\/message_start (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const startNumber = match[1];
    updateEnvVariable('MESSAGE_START_FROM', startNumber);
    console.log(`Updated start number to ${startNumber}`);
    bot.sendMessage(chatId, `Starting message number set to ${startNumber}.`);
});

bot.onText(/\/update_source_channel (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const source = match[1];
    updateEnvVariable('SOURCE_CHANNEL_ACCESS_ID', source);

    bot.sendMessage(chatId, `Source channelID updated with: ${source}.`);
    commandsUpdated = true;  // Set flag to true when command is used
});

bot.onText(/\/update_destination_channel (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const desti = match[1];
    updateEnvVariable('DESTINATION_CHANNEL_ACCESS_ID', desti);

    bot.sendMessage(chatId, `Destination channelID updated with: ${desti}.`);
    commandsUpdated = true;  // Set flag to true when command is used
});

bot.onText(/\/update_message_id (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const msgID = match[1];
    console.log(`Updated message ID to ${msgID}`);
    updateEnvVariable('MESSAGE_START_FROM', msgID);

    bot.sendMessage(chatId, `Message ID updated with: ${msgID}.`);
    commandsUpdated = true;  // Set flag to true when command is used
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
    console.log(`Updated ${key} to ${value}`);
};

async function main() {
    try {
        if (!start || start.trim() === "") {
            console.log("Please set starting message from /message_start '' command");
            bot.sendMessage(userID, `*Please set starting message with: \`/message_start '' \` command*`, { parse_mode: 'MarkdownV2' });
        } else {
            const client = new TelegramClient(stringSession, apiId, apiHash, {
                connectionRetries: 5,
            });
            await client.start({
                phoneNumber: async () => await input.text("Please enter your number: "),
                password: async () => await input.text("Please enter your password: "),
                phoneCode: async () => await input.text("Please enter the code you received: "),
                onError: (err) => console.log(err),
            });
            console.log("You should now be connected.");
            console.log(client.session.save());

            let i = start;

            bot.on('channel_post', async (msg) => {
                console.log(msg);
                // cuurentMessageDetails=msg;
            });

            const sourceChannel = await client.getEntity(new Api.PeerChannel({ channelId: process.env.SOURCE_CHANNEL_ACCESS_ID }));
            const SOURCE_CHANNEL_ACCESS_HASH = sourceChannel.accessHash;
            console.log({ "source": SOURCE_CHANNEL_ACCESS_HASH });

            const destiChannel = await client.getEntity(new Api.PeerChannel({ channelId: process.env.DESTINATION_CHANNEL_ACCESS_ID }));
            const DESTI_CHANNEL_ACCESS_HASH = destiChannel.accessHash;
            console.log({ "source": DESTI_CHANNEL_ACCESS_HASH });

            setInterval(async () => {
                element = i++;
                try {
                    // Fetch the full message from the source channel
                    const fullMsg = await client.invoke(
                        new Api.channels.GetMessages({
                            channel: new Api.InputChannel({ channelId: sourceChannel.id, accessHash: sourceChannel.accessHash }),
                            id: [element],
                        })
                    );

                    const message = fullMsg.messages[0]; // Get the message from the result

                    // Check if the message is a video or document
                    if (message.video || message.photo || message.document) {
                        await client.invoke(
                            new Api.messages.ForwardMessages({
                                fromPeer: new Api.InputPeerChannel({ channelId: sourceChannel.id, accessHash: sourceChannel.accessHash }),
                                id: [element],
                                randomId: [BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))],
                                toPeer: new Api.InputPeerChannel({ channelId: destiChannel.id, accessHash: destiChannel.accessHash }),
                                silent: true,
                                dropAuthor: true,
                            })
                        );
                    } else {
                        let message = `Skipping message with ID ${element} as it's not a video or document.`
                        console.log(message);
                        cuurentMessageDetails = message;
                    }

                } catch (error) {
                    console.log('Error in message forwarding:', error.message);
                    // Replace with your user ID or chat ID
                    bot.sendMessage(userID, `Error in message forwarding: ${error.message}`);
                }
            }, 10002); // Forward messages every 10 seconds

        }
    } catch (error) {
        console.log('Error:', error.message);
        bot.sendMessage(userID, `\`\`\`Error: ${error.message}\`\`\``, { parse_mode: 'MarkdownV2' });
    }
}

main();
