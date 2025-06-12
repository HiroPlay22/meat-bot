import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { emoji } from '@/utils/meatEmojis.js';
import { youtubeChannelImageCache } from './channelImageCache.js';
import type { YouTubeVideo } from './fetchLatestFromRSS.js';

export async function buildVideoEmbed(video: YouTubeVideo) {
  const url = video.link;
  const channelImage = youtubeChannelImageCache.get(video.channelId)
    ?? 'https://www.youtube.com/img/desktop/yt_1200.png';
  const hdThumbnail = `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`;

  const displayName = video.discordUserId
    ? `${video.channelTitle} (<@${video.discordUserId}>)`
    : video.channelTitle;

  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle(video.title)
    .setURL(url)
    .addFields([
      {
        name: '',
        value: `${emoji.meat_youtube} ${displayName}`,
        inline: true
      },
      {
        name: '',
        value: `${emoji.meat_calendar} <t:${Math.floor(new Date(video.publishedAt).getTime() / 1000)}:R>`,
        inline: true
      }
    ])
    .setThumbnail(channelImage)
    .setImage(hdThumbnail);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Zum Video')
      .setStyle(ButtonStyle.Link)
      .setURL(url),
    new ButtonBuilder()
      .setLabel('Zum Kanal')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://www.youtube.com/channel/${video.channelId}`)
  );

  return {
    embeds: [embed],
    components: [row],
    allowedMentions: { parse: [] } // ❌ kein Ping bei Mention!
  };
}
