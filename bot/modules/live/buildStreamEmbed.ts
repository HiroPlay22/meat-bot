// modules/live/buildStreamEmbed.ts

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { emoji } from '@/utils/meatEmojis.js';
import { getSafeTwitchThumbnail } from './getSafeTwitchThumbnail.js';

type StreamData = {
  username: string;
  title: string;
  game: string;
  viewers: number;
  thumbnail: string;        // Live-Vorschau
  categoryImage: string;    // BoxArt als Thumbnail
  profileImage: string;     // Avatar oben links
};

export async function buildStreamEmbed(stream: StreamData) {
  const url = `https://twitch.tv/${stream.username}`;
  const preview = await getSafeTwitchThumbnail(stream.username);

  const embed = new EmbedBuilder()
    .setColor('#9146FF')
    .setTitle(stream.title)
    .setURL(url)
    .setThumbnail(stream.categoryImage)
    .setImage(preview)
    .setDescription(`${emoji.meat_twitch} ${stream.username} ist jetzt live!`)
    .addFields([
      {
        name: '\u200B',
        value: `${emoji.meat_users} ${stream.viewers} Zuschauer`,
        inline: true
      },
      {
        name: '\u200B',
        value: `${emoji.meat_game} ${stream.game || '—'}`,
        inline: true
      }
    ]);

  const button = new ButtonBuilder()
    .setLabel(`Zum Stream`)
    .setStyle(ButtonStyle.Link)
    .setURL(url);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  return { embeds: [embed], components: [row] };
}
