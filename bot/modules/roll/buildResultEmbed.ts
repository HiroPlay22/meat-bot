import { EmbedBuilder, User } from 'discord.js';
import { getDiceEmoji, getRollQuality, getComment } from './rollUtils.js';

export function buildResultEmbed({
  user,
  type,
  rolls,
  modifier = 0
}: {
  user: User;
  type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  rolls: number[];
  modifier?: number;
}) {
  const sum = rolls.reduce((a, b) => a + b, 0);
  const total = sum + modifier;
  const max = rolls.length * parseInt(type.replace('d', ''));
  const quality = getRollQuality(total, max);
  const comment = getComment(quality);

  // Darstellung der Würfe
  const emojiRow = rolls.map(() => '🎲');
  const valueRow = rolls.map(n => `${n}`.padStart(2, ' '));
  const displayLine = emojiRow.map((e, i) => `${e} ${valueRow[i]}`).join(', ');

  const descriptionLines = [
    '```',
    displayLine,
    '```',
    modifier !== 0 ? `🎯 Modifier: ${modifier > 0 ? '+' : ''}${modifier}` : null,
    `🧠 Endergebnis: **${total}**`,
    '',
    `> ${comment}`
  ].filter(Boolean);

  const embed = new EmbedBuilder()
    .setColor(0x2f3136)
    .setThumbnail(user.displayAvatarURL())
    .setTitle(`${getDiceEmoji(rolls.length)} Ergebnis: **${total}**`)
    .setDescription(descriptionLines.join('\n'))
    .setFooter({
      text: `🧙 ${rolls.length}× ${type}${modifier !== 0 ? ` ${modifier > 0 ? '+' : ''}${modifier}` : ''}`
    });

  return embed;
}
