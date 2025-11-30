// FILE: src/bot/functions/polls/montag/montag.embeds.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import type { MontagSetupState } from './montag.service.js';

interface MontagSetupViewParams {
  serverName: string;
  nextMontagText: string;
  gameCount: number;
  state: MontagSetupState;
  excludedGameNames?: string[];
}

interface MontagPreviewViewParams {
  serverName: string;
  nextMontagText: string;
  state: MontagSetupState;
  excludedGameNames?: string[];
}

export function baueMontagSetupView({
  serverName,
  nextMontagText,
  gameCount,
  state,
  excludedGameNames,
}: MontagSetupViewParams) {
  const lines: string[] = [
    `🕹 **Montags-Runde Setup für _${serverName}_**`,
    '',
    `📅 Geplante Session: **${nextMontagText}**`,
    `🎮 Verfügbare Spiele in der Datenbank: **${gameCount}**`,
    '',
    `🔁 Mehrfachauswahl: **${state.allowMultiselect ? 'aktiv' : 'deaktiviert'}**`,
    `⏱ Dauer: **${state.durationHours}h**`,
  ];

  if (excludedGameNames && excludedGameNames.length > 0) {
    lines.push(
      '',
      '🚫 Ausgeschlossen (letzte Gewinner):',
      ...excludedGameNames.map((name) => `• ${name}`),
    );
  }

  lines.push(
    '',
    '➡ Klicke auf **„Umfrage vorbereiten“**, um eine zufällige Auswahl an Spielen zu generieren.',
  );

  const embed = new EmbedBuilder()
    .setTitle('Montags-Runde – Setup')
    .setDescription(lines.join('\n'))
    .setColor(0x5865f2); // Discord-Blurple

  const row1 =
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('poll_montag_prepare')
        .setStyle(ButtonStyle.Primary)
        .setLabel('Umfrage vorbereiten'),
      new ButtonBuilder()
        .setCustomId('poll_montag_add_game')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('Spiel hinzufügen'),
      new ButtonBuilder()
        .setCustomId('poll_montag_remove_game')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('Spiel deaktivieren'),
    );

  const row2 =
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('poll_montag_toggle_multiselect')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('Nur 1 Stimme erlauben'),
      new ButtonBuilder()
        .setCustomId('poll_montag_duration_dec')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('- 1h'),
      new ButtonBuilder()
        .setCustomId('poll_montag_duration_inc')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('+ 1h'),
    );

  const row3 =
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('poll_montag_cancel')
        .setStyle(ButtonStyle.Danger)
        .setLabel('Abbrechen'),
    );

  return {
    embed,
    components: [row1, row2, row3],
  };
}

export function baueMontagPreviewView({
  serverName,
  nextMontagText,
  state,
  excludedGameNames,
}: MontagPreviewViewParams) {
  const lines: string[] = [
    `🕹 **Montags-Runde Vorschau für _${serverName}_**`,
    '',
    `📅 Session: **${nextMontagText}**`,
    `🔁 Mehrfachauswahl: **${state.allowMultiselect ? 'aktiv' : 'deaktiviert'}**`,
    `⏱ Dauer: **${state.durationHours}h**`,
    '',
    '🎮 **Spiele in dieser Umfrage:**',
  ];

  if (!state.selectedGames.length) {
    lines.push('_Keine Spiele ausgewählt – bitte Setup anpassen._');
  } else {
    lines.push(
      ...state.selectedGames.map((game) => `• ${game.name}`),
    );
  }

  if (excludedGameNames && excludedGameNames.length > 0) {
    lines.push(
      '',
      '🚫 Ausgeschlossen (letzte Gewinner):',
      ...excludedGameNames.map((name) => `• ${name}`),
    );
  }

  const embed = new EmbedBuilder()
    .setTitle('Montags-Runde – Vorschau')
    .setDescription(lines.join('\n'))
    .setColor(0x57f287); // grüner "OK"-Ton

  const row1 =
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('poll_montag_preview_back')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('Zurück zum Setup'),
      new ButtonBuilder()
        .setCustomId('poll_montag_reroll')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('Spiele neu würfeln'),
    );

  const row2 =
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('poll_montag_start')
        .setStyle(ButtonStyle.Success)
        .setLabel('Umfrage starten'),
      new ButtonBuilder()
        .setCustomId('poll_montag_cancel')
        .setStyle(ButtonStyle.Danger)
        .setLabel('Abbrechen'),
    );

  return {
    embed,
    components: [row1, row2],
  };
}
