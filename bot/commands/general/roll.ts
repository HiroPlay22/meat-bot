// commands/general/roll.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { setRollState } from '@/modules/roll/rollState.js';
import { buildRollEmbed } from '@/modules/roll/buildRollEmbed.js';
import { buildRollButtons } from '@/modules/roll/buildRollButtons.js';

export const data = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Würfelt d4 bis d20');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  // Neue Session starten (leer)
  setRollState(interaction.user.id, {});

  const embed = buildRollEmbed({
    phase: 'phase1',
    user: interaction.user
  });

  const components = buildRollButtons({
    phase: 'phase1',
    viewer: interaction.user,
    owner: interaction.user
  });

  await interaction.editReply({ embeds: [embed], components });
}