// FILE: src/bot/functions/polls/poll.command.ts

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { SlashCommand } from '../../types/SlashCommand.js';
import { bauePollCenterView } from './poll.embeds.js';
import { logInfo } from '../../general/logging/logger.js';

export const pollCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Öffnet das M.E.A.T. Poll-Center.'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: 'Dieses Command kann nur auf einem Server verwendet werden.',
        ephemeral: true,
      });
      return;
    }

    const { embed, components } = bauePollCenterView(guild.name);

    await interaction.reply({
      embeds: [embed],
      components,
      ephemeral: true,
    });

    logInfo('Poll-Center geöffnet', {
      functionName: 'poll.command',
      guildId: interaction.guildId ?? undefined,
      userId: interaction.user.id,
    });
  },
};
