import { Client, TextChannel } from 'discord.js';
import { fetchLatestFromRSS } from './fetchLatestFromRSS.js';
import { buildVideoEmbed } from './buildVideoEmbed.js';
import serverSettings from '../../../config/serverSettings.json' with { type: 'json' };

export async function runYouTubeCheck(client: Client<true>) {
  const now = Date.now();
  const nowFormatted = new Date(now).toLocaleTimeString();

  console.log(`[M.E.A.T.-LOG] 🔁 Starte YouTube-Check @ ${nowFormatted}`);

  for (const [guildId, settings] of Object.entries(serverSettings.guilds)) {
    const { trackedYoutubeChannels, youtubeTargetChannelId } = settings;

    if (!trackedYoutubeChannels || !youtubeTargetChannelId) {
      console.log(`[M.E.A.T.-LOG] ⚠️ Keine YouTube-Kanäle oder kein Zielchannel definiert für Guild ${guildId}`);
      continue;
    }

    console.log(`[M.E.A.T.-LOG] ➕ ${trackedYoutubeChannels.length} YouTube-Kanäle geladen für Guild ${guildId}`);

    for (const channelConfig of trackedYoutubeChannels) {
      console.log(`[M.E.A.T.-LOG] 📡 Prüfe Kanal: ${channelConfig.channelTitle} (${channelConfig.channelId})`);

      let videos = [];
      try {
        videos = await fetchLatestFromRSS(channelConfig.channelId);
      } catch (err) {
        console.log(`[M.E.A.T.-LOG] ❌ Fehler beim Laden von Videos für ${channelConfig.channelId}:`, err);
        continue;
      }

      if (!videos || videos.length === 0) {
        console.log(`[M.E.A.T.-LOG] ⚠️ Keine Videos gefunden für ${channelConfig.channelTitle}`);
        continue;
      }

      for (const video of videos) {
        // Shorts ausschließen, wenn gewünscht
        if (channelConfig.excludeShorts && video.link.includes('shorts')) {
          console.log(`[M.E.A.T.-LOG] ⏭️ Überspringe Shorts: ${video.title}`);
          continue;
        }

        const videoTime = new Date(video.publishedAt).getTime();
        const minutesSince = (now - videoTime) / 1000 / 60;

        if (minutesSince > 10) {
          console.log(`[M.E.A.T.-LOG] ⏱️ Video zu alt (${Math.floor(minutesSince)}min): ${video.title}`);
          continue;
        }

        const discordChannel = client.channels.cache.get(youtubeTargetChannelId) as TextChannel;
        if (!discordChannel) {
          console.log(`[M.E.A.T.-LOG] ⚠️ Zielchannel nicht gefunden: ${youtubeTargetChannelId}`);
          continue;
        }

        const embed = buildVideoEmbed(video);
        await discordChannel.send(embed);

        console.log(`[M.E.A.T.-LOG] ✅ Video gepostet: "${video.title}" (${video.link})`);
      }
    }
  }

  console.log(`[M.E.A.T.-LOG] ✅ YouTube-Check abgeschlossen\n`);
}
