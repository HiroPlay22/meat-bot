// FILE: src/bot/commands/index.ts

import { Collection } from 'discord.js';
import type { SlashCommand } from '../types/SlashCommand.js';
import { pingCommand } from './general/ping.js';
import { datenschutzCommand } from '../functions/sentinel/datenschutz/datenschutz.command.js';
import { statsCommand } from '../functions/stats/overview/stats.command.js';
import { welcomeTestCommand } from './dev/welcomeTest.js';
import { pollCommand } from '../functions/polls/poll.command.js';

export const slashCommands = new Collection<string, SlashCommand>();

const alleCommands: SlashCommand[] = [
  pingCommand,
  datenschutzCommand,
  statsCommand,
  welcomeTestCommand,
  pollCommand,
];

for (const command of alleCommands) {
  slashCommands.set(command.data.name, command);
}

export const slashCommandList: SlashCommand[] = alleCommands;
