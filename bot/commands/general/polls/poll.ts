import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import {
  executeMontagPoll,
  executeMontagErgebnis,
  executeMontagClose
} from './montagPoll.js';

import { executePollErgebnisse } from './pollErgebnisse.js';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Starte oder verwalte eine Umfrage')
  .addSubcommand(sub =>
    sub.setName('montag')
      .setDescription('Starte das Montagsspiel-Voting')
  )
  .addSubcommand(sub =>
    sub.setName('montag_ergebnis')
      .setDescription('Zeigt das Ergebnis des aktuellen Montagsspiel-Votings an')
  )
  .addSubcommand(sub =>
    sub.setName('montag_close')
      .setDescription('Beende das aktuelle Montagsspiel-Voting')
  )
  .addSubcommand(sub =>
    sub.setName('ergebnis')
      .setDescription('Zeigt das letzte abgeschlossene Voting (pro Typ) an')
  );

export const category = 'general';

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'montag') return executeMontagPoll(interaction);
  if (sub === 'montag_ergebnis') return executeMontagErgebnis(interaction);
  if (sub === 'montag_close') return executeMontagClose(interaction);
  if (sub === 'ergebnis') return executePollErgebnisse(interaction);

  return interaction.reply({
    content: '❌ Unbekanntes Subcommand.',
    ephemeral: true
  });
}
