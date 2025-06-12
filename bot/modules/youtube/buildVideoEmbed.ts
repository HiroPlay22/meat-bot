import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { emoji } from '@/utils/meatEmojis.js';
import type { YouTubeVideo } from './fetchLatestFromRSS.js';
import { getYoutubeProfileImage } from './getYoutubeProfileImage.js';
import { getBestYoutubeThumbnail } from './getBestYoutubeThumbnail.js';

export async function buildVideoEmbed(video: YouTubeVideo) {
  const url = video.link;
  const channelUrl = `https://youtube.com/channel/${video.channelId}`;
  const profileImage = await getYoutubeProfileImage(video.channelId);
  const thumbnail = getBestYoutubeThumbnail(video.videoId);

  const displayName = video.discordUserId
    ? `${video.channelTitle} (<@${video.discordUserId}>)`
    : video.channelTitle;

  const embed = new EmbedBuilder()
    .setColor('#FF0000') // YouTube-Rot
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
    .setImage(thumbnail)
    .setThumbnail(profileImage ?? 'https://www.youtube.com/img/desktop/yt_1200.png');

  const videoButton = new ButtonBuilder()
    .setLabel(`Zum Video`)
    .setStyle(ButtonStyle.Link)
    .setURL(url);

  const channelButton = new ButtonBuilder()
    .setLabel(`Zum Kanal`)
    .setStyle(ButtonStyle.Link)
    .setURL(channelUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    videoButton,
    channelButton
  );

  return {
    embeds: [embed],
    components: [row],
    allowedMentions: { parse: [] } // keine pings bei <@>
  };
}
