// FILE: src/bot/functions/polls/poll.buttons.ts

import type { ButtonInteraction } from 'discord.js';
import { handleMontagPollButton } from './montag/montag.buttons.js';

export async function handlePollButtonInteraction(
  interaction: ButtonInteraction,
): Promise<void> {
  const customId = interaction.customId;

  if (customId.startsWith('poll_montag_') || customId === 'poll_type_montag') {
    await handleMontagPollButton(interaction);
    return;
  }

  // Fallback – unbekannter Poll-Button
  await interaction.reply({
    content: 'Dieser Poll-Button wird noch nicht unterstützt.',
    ephemeral: true,
  });
}
