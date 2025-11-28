// FILE: src/bot/commands/index.ts

import { Collection } from 'discord.js';
import type { SlashCommand } from '../types/SlashCommand.js';
import { pingCommand } from './general/ping.js';

// Map: commandName -> Command-Objekt
export const slashCommands = new Collection<string, SlashCommand>();

// Hier alle Commands registrieren
slashCommands.set(pingCommand.data.name, pingCommand);

// Liste aller Commands (z.B. für Registrierung)
export const slashCommandList: SlashCommand[] = Array.from(slashCommands.values());
