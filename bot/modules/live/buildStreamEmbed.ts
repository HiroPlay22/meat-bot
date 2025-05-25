import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  User,
  type Activity,
  type APIEmbedField,
} from 'discord.js';
import { getSafeTwitchThumbnail } from './getSafeTwitchThumbnail.js';
import { emoji } from '@/utils/meatEmojis.js';

export async function buildStreamEmbed(user: User, activity: Activity) {
  const url = activity.url ?? '';
  const isTwitch = url.includes('twitch.tv');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const username = url.split('/').pop() ?? user.username;

  const thumbnail = isTwitch
    ? getSafeTwitchThumbnail(username)
    : 'https://i.ytimg.com/vi_webp/default/hqdefault.webp'; // optional YouTube fallback

  const platformColor = isTwitch ? '#9146FF' : isYouTube ? '#FF0000' : '#666666';
  const platformIcon = isTwitch ? emoji.twitch : isYouTube ? emoji.youtube : emoji.meat_leer;
  const platformName = isTwitch ? 'Twitch' : isYouTube ? 'YouTube' : 'Stream';

  const embed = new EmbedBuilder()
    .setColor(platformColor)
    .setAuthor({
      name: `${user.username} streamt: ${activity.state ?? 'Unbekannt'}`,
      iconURL: user.displayAvatarURL(),
    })
    .setImage(thumbnail)
    .setDescription(`${emoji.stream} ${activity.details ?? `Live auf ${platformName}`}\n${emoji.text} ${activity.name ?? 'Stream läuft!'}`)
    .addFields([
      { name: `${emoji.user}`, value: username, inline: true },
      { name: `${emoji.viewers}`, value: '— Zuschauer', inline: true },
      { name: `${emoji.category} Kategorie`, value: activity.state ?? '—', inline: true },
    ])
    .setFooter({ text: 'Letzte Aktivität: Jetzt' });

  const button = new ButtonBuilder()
    .setLabel(`▶️ Zum Stream auf ${platformName}`)
    .setStyle(ButtonStyle.Link)
    .setEmoji(platformIcon)
    .setURL(url);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  return { embeds: [embed], components: [row] };
}
