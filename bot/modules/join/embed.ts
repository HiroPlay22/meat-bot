import { EmbedBuilder, GuildMember } from 'discord.js';
import {
  getJoinHeadline,
  getJoinReaction,
  getRandomReactions
} from './data.js';
import { emoji } from '@/utils/meatEmojis.js';

export function buildJoinEmbed(member: GuildMember): {
  embed: EmbedBuilder;
  reactions: string[];
} {
  const isBot = member.user.bot;
  const displayName = member.displayName;
  const server = member.guild.name;

  const headline = getJoinHeadline(displayName, server, isBot);
  const reactionLine = getJoinReaction(isBot);
  const reactions = getRandomReactions(3, isBot);
  const color = isBot ? 0xF5A623 : 0x7ED321;
  const joinTimestamp = Math.floor(member.joinedTimestamp! / 1000);

  const embed = new EmbedBuilder()
    .setTitle(headline)
    .setDescription(`> ${reactionLine.replace('{username}', displayName)}`)
    .setColor(color)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setImage('https://cdn.discordapp.com/attachments/1374459199181951087/1374459364475273266/join.jpg?ex=682e2088&is=682ccf08&hm=3593e1ff7dc53ba6bcef954ae4871970c323cee17cf2687cb8271b79958957b6&format=webp')
    .addFields(
      {
        name: ``,
        value: `${emoji.meat_members} ${displayName}`,
        inline: true
      },
      {
        name: ``,
        value: `${emoji.meat_users} #${member.guild.memberCount}`,
        inline: true
      },
      {
        name: ``,
        value: `${emoji.meat_calendar} <t:${joinTimestamp}:f>`,
        inline: true
      }
    )
    .setFooter({
      text: isBot
        ? `Automatisierter Zugriff 🤖`
        : `Neuzugang erkannt`
    });

  return { embed, reactions };
}
