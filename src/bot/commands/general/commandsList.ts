// FILE: src/bot/commands/general/commandsList.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { SlashCommand } from '../../types/SlashCommand.js';
import { slashCommandList } from '../index.js';

const BUTTON_COMMAND_STATS_ID = 'commands_show_stats';

export const commandsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Zeigt alle M.E.A.T. Slash-Commands.'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: 'Dieses Command kann nur auf einem Server verwendet werden.',
        ephemeral: true,
      });
      return;
    }

    const commands = slashCommandList.map((cmd) => ({
      name: cmd.data.name,
      description: cmd.data.description ?? '',
    }));

    const lines = commands.map(
      (c) => `/${c.name} - ${c.description || 'Keine Beschreibung'}`,
    );

    const half = Math.ceil(lines.length / 2);
    const left = lines.slice(0, half);
    const right = lines.slice(half);

    const embed = new EmbedBuilder()
      .setTitle(`M.E.A.T./Commands (${commands.length})`)
      .setColor(0x5865f2)
      .addFields(
        { name: '\u200b', value: left.join('\n') || '\u200b', inline: true },
        { name: '\u200b', value: right.join('\n') || '\u200b', inline: true },
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_COMMAND_STATS_ID)
        .setLabel('Statistiken')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
