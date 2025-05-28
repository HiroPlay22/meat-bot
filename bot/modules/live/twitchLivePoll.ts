// modules/live/twitchLivePoll.ts

import { getLiveStreams } from './getLiveStreams.js';
import { buildStreamEmbed } from './buildStreamEmbed.js';
import serverSettings from '@config/serverSettings.json' with { type: 'json' };
import { hasCooldown, setCooldown } from './liveCooldown.js';

const POLL_INTERVAL_MS = 2 * 60 * 1000; // alle 2 Minuten

function getTrackedUsernames(): string[] {
  const allUsers = Object.values(serverSettings.guilds)
    .flatMap((g: any) => g.trackedTwitchUsers ?? []);
  return [...new Set(allUsers.map(u => u.toLowerCase()))];
}

export function startTwitchLivePoll() {
  setInterval(async () => {
    try {
      const client = globalThis.discordClient;
      if (!client) {
        console.error('[LivePoll] ❌ Discord Client ist nicht gesetzt!');
        return;
      }

      const trackedUsers = getTrackedUsernames();
      console.log('[LivePoll] Starte mit Usern:', trackedUsers);

      const liveStreams = await getLiveStreams(trackedUsers);
      console.log('[LivePoll] Erkannte Live-Streams:', liveStreams.map(s => s.username));

      for (const stream of liveStreams) {
        const username = stream.username.toLowerCase();
        const cooldownKey = `live_${username}`;
        if (hasCooldown(cooldownKey)) {
          console.log(`[LivePoll] ❄️ Cooldown aktiv für ${username}`);
          continue;
        }

        let hasPosted = false;

        for (const [guildId, guildSettings] of Object.entries(serverSettings.guilds)) {
          const tracked = guildSettings.trackedTwitchUsers?.map((u: string) => u.toLowerCase()) ?? [];
          if (!tracked.includes(username)) continue;

          const guild = client.guilds.cache.get(guildId);
          if (!guild) {
            console.warn(`[LivePoll] ⚠️ Guild ${guildId} nicht im Cache – wird übersprungen.`);
            continue;
          }

          const liveChannel = client.channels.cache.get(guildSettings.liveChannelId);
          const logChannel = client.channels.cache.get(serverSettings.logChannelId);

          if (!liveChannel?.isTextBased()) {
            console.warn(`[LivePoll] ⚠️ Channel ${guildSettings.liveChannelId} ist kein Textkanal.`);
            continue;
          }

          const embedWithButton = await buildStreamEmbed(stream);
          await liveChannel.send(embedWithButton);
          hasPosted = true;

          if (logChannel?.isTextBased()) {
            await logChannel.send(`[M.E.A.T.-LOG] 📣 ${stream.username} wurde als 🔴LIVE erkannt.`);
          }
        }

        if (hasPosted) {
          setCooldown(cooldownKey, 2 * 60 * 60 * 1000); // 2h Cooldown ab JETZT
          console.log(`[LivePoll] ✅ Cooldown gesetzt für ${username}`);
        }
      }

    } catch (err) {
      console.error('[TwitchLivePoll] Fehler:', err);
    }
  }, POLL_INTERVAL_MS);
}
