// FILE: src/bot/functions/polls/poll.buttons.ts

import type { ButtonInteraction } from 'discord.js';
import { bauePollCenterView } from './poll.embeds.js';
import { handleMontagPollButton } from './montag/montag.buttons.js';
import { logError } from '../../general/logging/logger.js';

export async function handlePollButtonInteraction(
  interaction: ButtonInteraction,
): Promise<void> {
  const customId = interaction.customId;

  try {
    // Zurück ins Poll-Center
    if (customId === 'poll_center_back') {
      const guildName = interaction.guild?.name ?? 'deinem Server';
      const { embed, components } = bauePollCenterView(guildName);

      await interaction.update({
        embeds: [embed],
        components,
      });
      return;
    }

    // Montags-spezifische Buttons
    if (customId.startsWith('poll_montag_') || customId === 'poll_type_montag') {
      await handleMontagPollButton(interaction);
      return;
    }

    // Fallback
    await interaction.reply({
      content: 'Dieser Poll-Button wird noch nicht unterstützt.',
      ephemeral: true,
    });
  } catch (error) {
    logError('Fehler im Poll-Button-Router', {
      functionName: 'handlePollButtonInteraction',
      guildId: interaction.guildId ?? undefined,
      userId: interaction.user.id,
      extra: { error, customId },
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          'Uff. Beim Poll-Button ist etwas schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          'Uff. Beim Poll-Button ist etwas schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
        ephemeral: true,
      });
    }
  }
}
