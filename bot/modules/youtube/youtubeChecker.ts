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

    if (!trackedYoutubeChannels || !youtubeTargetChannelId) continue;

    for (const channelConfig of trackedYoutubeChannels) {
      console.log(`[M.E.A.T.-LOG] 📡 Prüfe Kanal: ${channelConfig.channelId}`);

      const videos = await fetchLatestFromRSS(channelConfig.channelId);

      for (const video of videos) {
        // Shorts ausschließen, wenn gewünscht
        if (channelConfig.excludeShorts && video.link.includes('shorts')) continue;

        const videoTime = new Date(video.publishedAt).getTime();
        const minutesSince = (now - videoTime) / 1000 / 60;

        if (minutesSince > 10) continue; // Nur Videos posten, die in den letzten 10 Min veröffentlicht wurden

        const discordChannel = client.channels.cache.get(youtubeTargetChannelId) as TextChannel;
        if (!discordChannel) {
          console.log(`[M.E.A.T.-LOG] ⚠️ Channel mit ID ${youtubeTargetChannelId} nicht gefunden.`);
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
