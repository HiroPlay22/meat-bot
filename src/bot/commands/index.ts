// FILE: src/bot/commands/index.ts

import { Collection } from 'discord.js';
import type { SlashCommand } from '../types/SlashCommand.js';
import { pingCommand } from './general/ping.js';
import { datenschutzCommand } from '../functions/sentinel/datenschutz/datenschutz.command.js';

// Map: commandName -> Command-Objekt
export const slashCommands = new Collection<string, SlashCommand>();

// Alle Commands zentral registrieren
const alleCommands: SlashCommand[] = [pingCommand, datenschutzCommand];

for (const command of alleCommands) {
  slashCommands.set(command.data.name, command);
}

// Liste aller Commands (z.B. für Registrierung)
export const slashCommandList: SlashCommand[] = alleCommands;
