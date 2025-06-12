import type tmi from 'tmi.js';
import { createTwitchClip } from '../utils/createClip.js';
import { postClipToDiscord } from '../utils/postClipToDiscord.js';
import { discordClient } from '../../bot/index.js';

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
      client.say(channel, `🎬 Clip wird erstellt...`);
      createTwitchClip()
        .then(async (clipUrl) => {
          if (clipUrl) {
            client.say(channel, `✅ Clip erstellt: ${clipUrl}`);
            await postClipToDiscord(discordClient, clipUrl);
          } else {
            client.say(channel, `❌ Clip konnte nicht erstellt werden.`);
          }
        })
        .catch((err) => {
          console.error('❌ Fehler beim Clip-Erstellen:', err);
          client.say(channel, `❌ Fehler bei der Clip-Erstellung.`);
        });
      break;

    default:
      break;
  }
}
