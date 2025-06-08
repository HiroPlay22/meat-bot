import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { emoji } from '@/utils/meatEmojis.js';

import type { YouTubeVideo } from './fetchLatestFromRSS.js';

export function buildVideoEmbed(video: YouTubeVideo) {
  const url = video.link;

  const embed = new EmbedBuilder()
    .setColor('#FF0000') // YouTube-Rot
    .setTitle(video.title)
    .setURL(url)
    .setAuthor({
      name: `${video.channelTitle} hat ein neues Video veröffentlicht!`,
      iconURL: 'https://www.youtube.com/s/desktop/27cdb1e2/img/favicon_144.png'
    })
    .addFields([
      {
        name: '',
        value: `${emoji.meat_youtube} ${video.channelTitle}`,
        inline: true
      },
      {
        name: '',
        value: `${emoji.meat_calendar} <t:${Math.floor(new Date(video.publishedAt).getTime() / 1000)}:R>`,
        inline: true
      }
    ])
    .setImage(video.thumbnail) // Thumbnail
    .setThumbnail('https://www.youtube.com/img/desktop/yt_1200.png');

  const button = new ButtonBuilder()
    .setLabel(`Zum Video`)
    .setStyle(ButtonStyle.Link)
    .setURL(url);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  return { embeds: [embed], components: [row] };
}
