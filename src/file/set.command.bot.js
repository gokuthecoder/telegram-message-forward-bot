const getBotInstance = require('../../botInstance.js');
const bot = getBotInstance();

bot.setMyCommands([
  { command: '/start ', description: 'Start interacting with the bot' },
  { command: '/setting ', description: 'Adjust your settings' },
  { command: '/stop ', description: 'stop your bot' },
  { command: '/setchannel ', description: 'Set Source and Destination Channel IDs' },
  { command: '/message_start ' , description: 'Set the message to start from' },
  { command: '/update_source_channel ' , description: 'Update the source channel' },
  { command: '/update_destination_channel ' , description: 'Update the destination channel' },
  { command: '/video_forwarding ' , description: 'Enable/Disable video forwarding' },
  { command: '/audio_forwarding ' , description: 'Enable/Disable audio forwarding' },
  { command: '/photo_forwarding ' , description: 'Enable/Disable photo forwarding' },
  { command: '/document_forwarding ' , description: 'Enable/Disable document forwarding' },
  { command: '/stickers_forwarding ' , description: 'Enable/Disable stickers forwarding' },
  { command: '/gif_forwarding ' , description: 'Enable/Disable gif forwarding' },
]);