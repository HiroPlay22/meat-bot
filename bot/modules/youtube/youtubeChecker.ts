import { Client, TextChannel } from 'discord.js';
import { fetchLatestFromRSS } from './fetchLatestFromRSS.js';
import { buildVideoEmbed } from './buildVideoEmbed.js';
import { buildShortsEmbed } from './buildShortsEmbed.js';
import { prisma } from '@database/client.js';
import serverSettings from '../../../config/serverSettings.json' with { type: 'json' };

// 🧹 Alte Einträge (> 7 Tage) bereinigen
async function cleanOldYouTubePosts() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const deleted = await prisma.youTubePost.deleteMany({
    where: {
      postedAt: { lt: oneWeekAgo }
    }
  });

  console.log(`[M.E.A.T.-CLEANUP] 🧹 Alte YouTubePosts gelöscht: ${deleted.count}`);
}

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
        const isShort = video.link.includes('/shorts');
        if (channelConfig.excludeShorts && isShort) continue;

        video.channelId = channelConfig.channelId;
        video.discordUserId = channelConfig.discordUserId;

        const videoTime = new Date(video.publishedAt).getTime();
        const hoursSince = (now - videoTime) / 1000 / 60 / 60;
        if (hoursSince > 24) continue;

        const alreadyPosted = await prisma.youTubePost.findUnique({
          where: { videoId: video.videoId }
        });

        if (alreadyPosted) {
          console.log(`[M.E.A.T.-LOG] ⏩ Bereits gepostet: "${video.title}"`);
          continue;
        }

        const discordChannel = client.channels.cache.get(youtubeTargetChannelId) as TextChannel;
        if (!discordChannel) continue;

        const embedBuilder = isShort ? buildShortsEmbed : buildVideoEmbed;
        const { embeds, components, allowedMentions } = await embedBuilder(video);

        await discordChannel.send({ embeds, components, allowedMentions });

        await prisma.youTubePost.create({
          data: {
            videoId: video.videoId,
            guildId
          }
        });

        console.log(`[M.E.A.T.-LOG] ✅ Video gepostet & gespeichert: "${video.title}"`);
      }
    }
  }

  await cleanOldYouTubePosts();

  console.log(`[M.E.A.T.-LOG] ✅ YouTube-Check abgeschlossen\n`);
}
