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

    console.log(`[M.E.A.T.-LOG] ➕ ${trackedYoutubeChannels.length} YouTube-Kanäle geladen für Guild ${guildId}`);

    for (const channelConfig of trackedYoutubeChannels) {
      console.log(`[M.E.A.T.-LOG] 📡 Prüfe Kanal: ${channelConfig.channelTitle} (${channelConfig.channelId})`);

      let videos = [];
      try {
        videos = await fetchLatestFromRSS(channelConfig.channelId);
      } catch (err) {
        console.log(`[M.E.A.T.-LOG] ❌ Fehler beim Abrufen von ${channelConfig.channelId}:`, err);
        continue;
      }

      console.log(`[M.E.A.T.-LOG] 📄 ${videos.length} Videos gefunden`);

      for (const video of videos) {
        if (channelConfig.excludeShorts && video.link.includes('shorts')) continue;

        // Video-Daten anreichern (Wird später ins Embed übernommen)
        video.channelId = channelConfig.channelId;
        video.discordUserId = channelConfig.discordUserId;

        const videoTime = new Date(video.publishedAt).getTime();
        const hoursSince = (now - videoTime) / 1000 / 60 / 60;

        // ❌ Nur Videos aus den letzten 24h posten
        if (hoursSince > 24) continue;

        const discordChannel = client.channels.cache.get(youtubeTargetChannelId) as TextChannel;
        if (!discordChannel) continue;

        const { embeds, components, allowedMentions } = await buildVideoEmbed(video);
        await discordChannel.send({ embeds, components, allowedMentions });

        console.log(`[M.E.A.T.-LOG] ✅ Video gepostet: "${video.title}"`);
      }
    }
  }

  console.log(`[M.E.A.T.-LOG] ✅ YouTube-Check abgeschlossen\n`);
}
