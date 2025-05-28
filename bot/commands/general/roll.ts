// bot/commands/general/roll.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { setRollState } from '@/modules/roll/rollState.js';
import { buildRollEmbed } from '@/modules/roll/buildRollEmbed.js';
import { buildRollButtons } from '@/modules/roll/buildRollButtons.js';

export const data = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Würfelt d4 bis d20');

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    // Verhindert doppelte Verarbeitung
    if (interaction.replied || interaction.deferred) {
      console.warn('⚠️ /roll wurde bereits beantwortet oder deferred.');
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;

    // Neue Session starten (mit ownerId)
    setRollState(userId, {
      ownerId: userId
    });

    const embed = buildRollEmbed({
      phase: 'phase1',
      user: interaction.user
    });

    const components = buildRollButtons({
      phase: 'phase1',
      viewer: interaction.user,
      owner: { id: userId }
    });

    await interaction.editReply({ embeds: [embed], components });
  } catch (err: any) {
    console.error('❌ Fehler im /roll Command:', err);
    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Beim Ausführen des Befehls ist ein Fehler aufgetreten.',
        ephemeral: true
      }).catch(() => {});
    }
  }
}
