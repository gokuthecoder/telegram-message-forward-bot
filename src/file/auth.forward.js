const fs = require("fs");
const path = require("path");
const input = require("input");
const dotenv = require("dotenv");
const { Api, TelegramClient } = require("telegram");
const TelegramBot = require('node-telegram-bot-api');
const { StringSession } = require("telegram/sessions");
const winston = require('winston');
const moment = require('moment-timezone');
dotenv.config();

const getBotInstance = require('../../botInstance.js');
const bot = getBotInstance();

function logWithIST(level, message) {
    const timestamp = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(timestamp.getTime() + istOffset);
    const formattedTime = istDate.toISOString().replace('T', ' ').slice(0, 19); // Format to YYYY-MM-DD HH:MM:SS

    console.log(`[${formattedTime}] ${level}: ${message}`);
}

logWithIST('INFO', 'Starting bot process');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: () => moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss') // IST time
        }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'forwarder-bot.log' })
    ]
});

// Example logs
logger.info('Starting bot process');


const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const USERID = process.env.USERID;
const userID = USERID;
let element;
const stringSession = new StringSession(process.env.SESSION_STRING);

const Source_Channel_ID = process.env.SOURCE_CHANNEL_ACCESS_ID;
const DESTINATION_CHANNEL_ACCESS_ID = process.env.DESTINATION_CHANNEL_ACCESS_ID;

let commandsUpdated = false;  // Flag to track if commands were updated
let restartFlag = false; // Flag to trigger a restart
let start = process.env.MESSAGE_START_FROM;
let cuurentMessageDetails;

let ISVIDEO;
if (process.env.ISVIDEO == 'true') {
    ISVIDEO = 'DocumentAttributeVideo';
} else {
    console.log('Hey ISVIDEO IS false');
}

let ISAUDIO;
if (process.env.ISAUDIO == 'true') {
    ISAUDIO = 'DocumentAttributeAudio';
} else {
    console.log('Hey ISAUDIO IS false')
}

let ISPHOTO;
if (process.env.ISPHOTO == 'true') {
    ISPHOTO = 'MessageMediaPhoto';
} else {
    console.log('Hey ISPHOTO IS false')
}

let ISDOCUMENT;
if (process.env.ISDOCUMENT == 'true') {
    ISDOCUMENT = 'DocumentAttributeFilename';
} else {
    console.log('Hey ISDOCUMENT IS false')
}

let ISSTICKERS;
if (process.env.ISSTICKERS == 'true') {
    ISSTICKERS = 'DocumentAttributeSticker';
} else {
    console.log('Hey ISSTICKERS IS false')
}

let ISGIF;
if (process.env.ISGIF == 'true') {
    ISGIF = 'DocumentAttributeAnimated';
} else {
    console.log('Hey ISGIF IS false')
}

let ISDOCUMENTIMAGE;
if (process.env.ISDOCUMENTIMAGE == 'true') {
    ISDOCUMENTIMAGE = 'DocumentAttributeImageSize';
} else {
    console.log('Hey ISDOCUMENTIMAGE IS false')
};

/* let ISDOCUMENTCUSTOMEMOJI;
if (process.env.ISDOCUMENTCUSTOMEMOJI == 'true') {
    ISDOCUMENTCUSTOMEMOJI = 'DocumentAttributeCustomEmoji';  -- Remark by Homelander(haven't any idea)
} else {
    console.log('Hey ISDOCUMENTCUSTOMEMOJI IS false')
} */

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
                    { text: 'Show .env', callback_data: 'show_env' } // Existing button
                ],
                [
                    { text: 'Send Logs', callback_data: 'send_logs' } // New button
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
    } else if (data === 'send_logs') {
        // Path to the log file generated by pm2 (You may need to adjust this depending on your pm2 configuration)
        const logFilePath = path.join(__dirname, '../../forwarder-bot.log');

        // Read the log file and send it to the user
        fs.readFile(logFilePath, (err, logData) => {
            if (err) {
                bot.sendMessage(message.chat.id, `Error reading log file: ${err.message}`);
                return;
            }

            // Send the log file as a document
            bot.sendDocument(message.chat.id, logFilePath, {
                caption: 'Here are the logs from the bot.'
            });

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

    bot.sendMessage(chatId, `Destination channelID updated with: ${desti.trim()}.`);
    commandsUpdated = true;  // Set flag to true when command is used
});

bot.onText(/\/update_message_from (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const msgID = match[1];
    console.log(`Updated message ID to ${msgID}`);
    updateEnvVariable('MESSAGE_START_FROM', msgID);

    bot.sendMessage(chatId, `Message ID updated with: ${msgID}.`);
    commandsUpdated = true;  // Set flag to true when command is used
});

// forwarding

// bot.onText(/\/all_forwarding (true|false|\d+)/, (msg, match) => {
//     const chatId = msg.chat.id;
//     const msgID = match[1];
//     console.log(`isvideo forwarding : ${msgID}`);   
//     updateEnvVariable('ISVIDEO', msgID);

//     bot.sendMessage(chatId, `isVideo is now start forwrding : ${msgID}.`);
//     commandsUpdated = true;  // Set flag to true when command is used
// });                                                                                    --> Remark by Homelander

bot.onText(/\/video_forwarding (true|false|\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const msgID = match[1];
    console.log(`isvideo forwarding : ${msgID}`);
    updateEnvVariable('ISVIDEO', msgID);

    bot.sendMessage(chatId, `isVideo is now start forwrding : ${msgID}.`);
    commandsUpdated = true;  // Set flag to true when command is used
});

bot.onText(/\/audio_forwarding (true|false|\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const msgID = match[1];
    console.log(`isAudio forwarding : ${msgID}`);
    updateEnvVariable('ISAUDIO', msgID);

    bot.sendMessage(chatId, `isAudio is now start forwrding : ${msgID}.`);
    commandsUpdated = true;  // Set flag to true when command is used
});

bot.onText(/\/photo_forwarding (true|false|\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const msgID = match[1];
    console.log(`isphoto forwarding : ${msgID}`);
    updateEnvVariable('ISPHOTO', msgID);

    bot.sendMessage(chatId, `isPhoto is now start forwrding : ${msgID}.`);
    commandsUpdated = true;  // Set flag to true when command is used
});

bot.onText(/\/document_forwarding (true|false|\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const msgID = match[1];
    console.log(`isDocument forwarding : ${msgID}`);
    updateEnvVariable('ISDOCUMENT', msgID);
    updateEnvVariable('ISDOCUMENTIMAGE', msgID);

    bot.sendMessage(chatId, `isDocuent is now start forwrding : ${msgID}.`);
    commandsUpdated = true;  // Set flag to true when command is used
});

bot.onText(/\/stickers_forwarding (true|false|\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const msgID = match[1];
    console.log(`isStickers forwarding : ${msgID}`);
    updateEnvVariable('ISSTICKERS', msgID);

    bot.sendMessage(chatId, `isStickers is now start forwrding : ${msgID}.`);
    commandsUpdated = true;  // Set flag to true when command is used
});

bot.onText(/\/gif_forwarding (true|false|\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const msgID = match[1];
    console.log(`isGif forwarding : ${msgID}`);
    updateEnvVariable('ISGIF', msgID);

    bot.sendMessage(chatId, `isGif is now start forwrding : ${msgID}.`);
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
                    const fullMsg = await client.invoke(
                        new Api.channels.GetMessages({
                            channel: new Api.InputChannel({ channelId: sourceChannel.id, accessHash: sourceChannel.accessHash }),
                            id: [element],
                        })
                    );

                    const message = fullMsg.messages[0];

                    if (message?.media == null) {
                        console.log('ONLY TEXT BASE MESSAGES');
                        return;  // Exit the current iteration to avoid forwarding
                    };

                    let messageAttribute = message.media?.document?.attributes || [];
                    let AllAtributeList = messageAttribute?.map(attr => attr.className);

                    console.log("Original Attributes:", AllAtributeList);

                    // Modify the AllAtributeList based on its length
                    if (AllAtributeList.length === 3) {
                        AllAtributeList = [AllAtributeList[1]];  // Keep only the middle element
                    } else if (AllAtributeList.length === 2) {
                        AllAtributeList = [AllAtributeList[0]];  // Keep only the first element
                    }

                    // console.log("Modified Attributes:", AllAtributeList);
                    // console.log(`message Info: `, message);

                    if (message?.media?.className === ISPHOTO) {
                        await forwardMessage(element, 'photo');
                        console.log(`message className has or not`  ,message.media?.photo?.className);
                        console.log(`message is photo`)
                    } else {
                        console.log('Message is not Photo')
                    };


                    if(message?.media == null){
                        console.log('ONLY TEXT BASE MESSAGES');
                    };

                    // Check the remaining attribute in the modified AllAtributeList
                    for (let attr of AllAtributeList) {
                        if (attr === ISVIDEO) {
                            await forwardMessage(element, 'video');
                            break;
                        } else if (attr === ISAUDIO) {
                            await forwardMessage(element, 'audio');
                            break;
                        } else if (attr === ISGIF) {
                            await forwardMessage(element, 'gif');
                            break;
                        } else if (attr === ISSTICKERS) {
                            await forwardMessage(element, 'stickers');
                            break;
                        } else if (attr === ISDOCUMENT || attr === ISDOCUMENTIMAGE) { //attr === ISDOCUMENTCUSTOMEMOJI(haven't any idea) --> Remark by Homelander
                            await forwardMessage(element, 'document');
                            break;
                        }
                    }

                } catch (error) {
                    console.log('Error in message forwarding:', error);
                }
            }, 10002);

            async function forwardMessage(element, type) {
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
                console.log(`message is ${type}`);
            }

        }
    } catch (error) {
        console.log('Error:', error.message);
        //t bot.sendMessage(userID, `\`\`\`Error: ${error.message}\`\`\``, { parse_mode: 'MarkdownV2' });
    }
}

main();
