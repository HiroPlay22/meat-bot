import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { emoji } from '@/utils/meatEmojis.js';
import type { YouTubeVideo } from './fetchLatestFromRSS.js';
import { getYoutubeProfileImage } from './getYoutubeProfileImage.js';

export async function buildShortsEmbed(video: YouTubeVideo) {
  const profileImage = await getYoutubeProfileImage(video.channelId);
  const displayName = video.discordUserId
    ? `${video.channelTitle} (<@${video.discordUserId}>)`
    : video.channelTitle;

  // Hochformat-Vorschaubild für Shorts
  const shortThumbnail = `https://i.ytimg.com/vi/${video.videoId}/hq720.jpg`;

  // Shorts-Link & Kanal-Shorts-Seite
  const shortUrl = video.link;
  const shortsOverviewUrl = `https://www.youtube.com/channel/${video.channelId}/shorts`;

  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle(video.title)
    .setURL(shortUrl)
    .addFields([
      {
        name: '\u200B',
        value: `${emoji.meat_youtube} ${displayName}`,
        inline: true
      },
      {
        name: '\u200B',
        value: `${emoji.meat_calendar} <t:${Math.floor(new Date(video.publishedAt).getTime() / 1000)}:R>`,
        inline: true
      }
    ])
    .setImage(shortThumbnail)
    .setThumbnail(profileImage ?? 'https://www.youtube.com/img/desktop/yt_1200.png');

  const shortButton = new ButtonBuilder()
    .setLabel('Zum Short')
    .setStyle(ButtonStyle.Link)
    .setURL(shortUrl);

  const overviewButton = new ButtonBuilder()
    .setLabel('Weitere Shorts')
    .setStyle(ButtonStyle.Link)
    .setURL(shortsOverviewUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    shortButton,
    overviewButton
  );

  return {
    embeds: [embed],
    components: [row],
    allowedMentions: { parse: [] }
  };
}
