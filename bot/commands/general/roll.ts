import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { setRollState } from '@/modules/roll/rollState.js';
import { buildRollEmbed } from '@/modules/roll/buildRollEmbed.js';
import { buildRollButtons } from '@/modules/roll/buildRollButtons.js';

export const data = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Würfelt d4 bis d20');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });

  const userId = interaction.user.id;

  // Neue Session starten (mit ownerId und leerem Verlauf)
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
}
