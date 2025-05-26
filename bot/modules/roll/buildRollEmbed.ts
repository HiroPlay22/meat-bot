import { EmbedBuilder, User } from 'discord.js';
import { imageAssets } from './imageAssets.js';
import { emoji, safe } from '@/utils/meatEmojis.js';

export function buildRollEmbed({
  phase,
  user,
  type,
  count,
  modifier,
  gmEnabled
}: {
  phase: 'phase1' | 'phase2' | 'phase3';
  user: User;
  type?: 'd6' | 'd4' | 'd8' | 'd10' | 'd12' | 'd20';
  count?: number;
  modifier?: number;
  gmEnabled?: boolean;
}) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({ name: `${user.username} würfelt...`, iconURL: user.displayAvatarURL() });

  switch (phase) {
    case 'phase1': {
      embed
        .setTitle('🎲 Zufallsbefehl getriggert')
        .setDescription('Bereit für das Unbekannte?')
        .setImage(imageAssets.rollStart);
      break;
    }

    case 'phase2': {
      if (!type) throw new Error('Missing dice type in phase2');

      const titleEmoji = type === 'd6' ? emoji.meat_dice : emoji.meat_dnd;
      embed
        .setTitle(`${safe(titleEmoji)} ${type === 'd6' ? 'Würfelmodus aktiviert' : 'DnD-Modus aktiviert'}`)
        .setDescription('Wie viele Würfel möchtest du rollen?')
        .setImage(type === 'd6' ? imageAssets.rollDiceClassic : imageAssets.rollDiceDnd);
      break;
    }

    case 'phase3': {
      if (!type || !count) throw new Error('Missing type or count in phase3');

      const titleEmoji = type === 'd6' ? emoji.meat_dice : emoji.meat_dnd;
      const modText = modifier !== undefined ? ` mit einem Modifier von ${modifier > 0 ? `+${modifier}` : modifier}` : '';
      const footerText = `${safe(titleEmoji)} ${count}× ${type}${modifier !== undefined ? ` ${modifier > 0 ? '+' : ''}${modifier}` : ''}`;

      embed
        .setTitle(`${safe(titleEmoji)} ${count}× ${type}`)
        .setDescription(`Du hast ${count}× ${type} gewählt${modText}. Jetzt leg los!`)
        .setImage(type === 'd6' ? imageAssets.rollDiceClassic : imageAssets.rollDiceDnd)
        .setFooter({ text: footerText });

      if (gmEnabled) {
        embed.addFields({
          name: `${safe(emoji.meat_gm)} GM-Channel-Modus aktiviert`,
          value: 'Dein Ergebnis wird im GameMaster-Channel veröffentlicht.'
        });
      }
      break;
    }
  }

  return embed;
}
