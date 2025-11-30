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
    .setDescription('Öffnet das M.E.A.T. Poll-Center (z.B. für die Montags-Runde).'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildName = interaction.guild?.name ?? 'deinem Server';

    const { embed, components } = bauePollCenterView(guildName);

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
