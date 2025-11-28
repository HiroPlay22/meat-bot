// FILE: src/bot/commands/general/ping.ts

import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/SlashCommand.js';

export const pingCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Antwortet mit einem saftigen Pong von M.E.A.T.'),

  async execute(interaction) {
    await interaction.reply('Pong! 🥩');
  },
};
