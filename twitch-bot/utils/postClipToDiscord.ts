import { Client } from 'discord.js';
import fs from 'fs';
import path from 'path';

/**
 * Postet einen Twitch-Clip-Link in den konfigurierten Discord-Kanal.
 * Lädt die channelId aus config/serverSettings.json
 */
export async function postClipToDiscord(discordClient: Client, clipUrl: string) {
  const settingsPath = path.resolve(process.cwd(), 'config/serverSettings.json');
  const config = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

  // Optional: explizite Guild-ID auswählen (erste nehmen)
  const guildId = Object.keys(config.guilds)[0];
  const clipChannelId = config.guilds[guildId]?.clipChannelId;

  if (!clipChannelId) {
    console.error('❌ Kein clipChannelId für Guild gefunden.');
    return;
  }

  const channel = await discordClient.channels.fetch(clipChannelId);
  if (!channel?.isTextBased()) {
    console.error(`❌ Channel ${clipChannelId} ist ungültig oder nicht textbasiert.`);
    return;
  }

  await channel.send(`🎬 Neuer Clip: ${clipUrl}`);
  console.log(`✅ Clip gepostet: ${clipUrl}`);
}
