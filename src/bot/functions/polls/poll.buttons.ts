// FILE: src/bot/functions/polls/poll.buttons.ts

import type { ButtonInteraction } from 'discord.js';
import { handleMontagPollButton } from './montag/montag.buttons.js';

/**
 * Zentraler Router für alle Poll-Buttons.
 *
 * WICHTIG:
 * - Diese Funktion macht KEINE eigenen Replies/Updates/Defers.
 * - Die konkrete Handler-Funktion (z.B. handleMontagPollButton)
 *   ist allein dafür zuständig, die Interaction zu bestätigen.
 */
export async function handlePollButtonInteraction(
  interaction: ButtonInteraction,
): Promise<void> {
  const customId = interaction.customId;

  // Montags-Runde (Setup + Buttons)
  if (
    customId === 'poll_type_montag' ||
    customId.startsWith('poll_montag_')
  ) {
    await handleMontagPollButton(interaction);
    return;
  }

  // Fallback für noch nicht implementierte Poll-Buttons
  await interaction.reply({
    content:
      'Dieser Poll-Button wird aktuell noch nicht unterstützt. Sag Hiro, er soll mich konfigurieren. 💾',
    ephemeral: true,
  });
}
