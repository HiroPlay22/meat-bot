// FILE: src/bot/functions/sentinel/datenschutz/datenschutz.command.ts

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { SlashCommand } from '../../../types/SlashCommand.js';
import { ladeTexte } from '../../../general/texts/text-loader.js';
import { ermittleTrackingStatus } from './datenschutz.service.js';
import { baueDatenschutzEmbedUndKomponenten } from './datenschutz.embeds.js';
import { logError, logInfo } from '../../../general/logging/logger.js';

const texte = ladeTexte('sentinel/datenschutz', 'de');

export const datenschutzCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(texte.command.name)
    .setDescription(texte.command.description),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    const userId = interaction.user?.id ?? null;

    try {
      const status = await ermittleTrackingStatus(guildId ?? null, userId);

      const { embed, komponenten } =
        baueDatenschutzEmbedUndKomponenten(status);

      await interaction.reply({
        embeds: [embed],
        components: komponenten,
        ephemeral: true,
      });

      logInfo('Datenschutz-Übersicht angezeigt', {
        functionName: 'datenschutz.command',
        guildId: guildId ?? undefined,
        userId: interaction.user?.id ?? undefined,
      });
    } catch (error) {
      logError('Fehler im /datenschutz-Command', {
        functionName: 'datenschutz.command',
        guildId: guildId ?? undefined,
        userId: interaction.user?.id ?? undefined,
        extra: { error },
      });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: texte.responses.error,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: texte.responses.error,
          ephemeral: true,
        });
      }
    }
  },
};
