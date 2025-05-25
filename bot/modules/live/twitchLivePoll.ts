import { getLiveStreams } from './getLiveStreams.js';
import { buildStreamEmbed } from './buildStreamEmbed.js';
import { client } from '@/core/client.js';
import serverSettings from '@config/serverSettings.json' with { type: 'json' };
import { hasCooldown, setCooldown } from './liveCooldown.js';

const POLL_INTERVAL_MS = 2 * 60 * 1000; // alle 2 Minuten

function getTrackedUsernames(): string[] {
  const allUsers = Object.values(serverSettings.guilds)
    .flatMap((g: any) => g.trackedTwitchUsers ?? []);
  return [...new Set(allUsers.map(u => u.toLowerCase()))]; // Duplikate filtern
}

export function startTwitchLivePoll() {
  setInterval(async () => {
    try {
      const trackedUsers = getTrackedUsernames();
      const liveStreams = await getLiveStreams(trackedUsers);

      for (const stream of liveStreams) {
        const cooldownKey = `live_${stream.username.toLowerCase()}`;
        if (hasCooldown(cooldownKey)) continue;

        for (const [guildId, guildSettings] of Object.entries(serverSettings.guilds)) {
          if (!guildSettings.trackedTwitchUsers?.includes(stream.username.toLowerCase())) continue;

          const liveChannelId = guildSettings.liveChannelId;
          const logChannelId = serverSettings.logChannelId;

          const liveChannel = client.channels.cache.get(liveChannelId);
          const logChannel = client.channels.cache.get(logChannelId);

          if (!liveChannel?.isTextBased()) continue;

          const embedWithButton = await buildStreamEmbed(stream);
          await liveChannel.send(embedWithButton);

          if (logChannel?.isTextBased()) {
            await logChannel.send(`📣 ${stream.username} wurde per Twitch API als 🔴LIVE erkannt.`);
          }

          setCooldown(cooldownKey, 2 * 60 * 60 * 1000);
        }
      }
    } catch (err) {
      console.error('[TwitchLivePoll] Fehler:', err);
    }
  }, POLL_INTERVAL_MS);
}
