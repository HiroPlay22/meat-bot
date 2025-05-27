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
  thumbnail: string;
};

export async function buildStreamEmbed(stream: StreamData) {
  const url = `https://twitch.tv/${stream.username}`;
  const thumbnail = await getSafeTwitchThumbnail(stream.username); // WICHTIG: await

  const embed = new EmbedBuilder()
    .setColor('#9146FF')
    .setAuthor({
      name: `${stream.username} ist jetzt live!`,
      iconURL: 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png'
    })
    .setImage(thumbnail)
    .setDescription(`${emoji.stream} ${stream.title}\n${emoji.text} Stream läuft auf Twitch`)
    .addFields([
      { name: `${emoji.user}`, value: stream.username, inline: true },
      { name: `${emoji.viewers}`, value: `${stream.viewers} Zuschauer`, inline: true },
      { name: `${emoji.category} Kategorie`, value: stream.game || '—', inline: true }
    ])
    .setFooter({ text: 'Live via Twitch API' });

  const button = new ButtonBuilder()
    .setLabel(`▶️ Zum Stream`)
    .setStyle(ButtonStyle.Link)
    .setEmoji(emoji.twitch)
    .setURL(url);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  return { embeds: [embed], components: [row] };
}
