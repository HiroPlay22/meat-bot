import type tmi from 'tmi.js';

export function handleChatCommand(
  client: tmi.Client,
  channel: string,
  tags: tmi.ChatUserstate,
  message: string
) {
  const [command] = message.trim().split(/\s+/);
  const username = tags['display-name'] || tags.username || 'User';

  switch (command.toLowerCase()) {
    case '!hello':
      client.say(channel, `Hey ${username}, willkommen bei M.E.A.T.! 🤖`);
      break;

    case '!clip':
      client.say(channel, `🎬 Clip-Funktion wird vorbereitet...`);
      // Hier bauen wir später die echte Clip-API + Discord-Webhook ein
      break;

    default:
      break;
  }
}
