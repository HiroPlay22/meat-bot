import tmi from 'tmi.js';
import { handleChatCommand } from './handlers/chatCommands.js';

export async function startBot() {
  const client = new tmi.Client({
    identity: {
      username: process.env.TWITCH_BOT_USERNAME!,
      password: `oauth:${process.env.TWITCH_BOT_ACCESS_TOKEN}`,
    },
    channels: [process.env.TWITCH_BOT_CHANNEL!],
    connection: {
      reconnect: true,
      secure: true,
    },
  });

  client.on('message', (channel, tags, message, self) => {
    if (self) return;
    handleChatCommand(client, channel, tags, message);
  });

  await client.connect();
  console.log(`✅ Twitch-Bot ${process.env.TWITCH_BOT_USERNAME} ist online in #${process.env.TWITCH_BOT_CHANNEL}`);
}
