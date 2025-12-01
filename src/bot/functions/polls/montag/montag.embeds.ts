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

function formatDurationText(hours: number): string {
  const clamped = Math.max(1, Math.min(hours, 32 * 24));
  const days = Math.floor(clamped / 24);
  const restHours = clamped % 24;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(days === 1 ? '1 Tag' : `${days} Tage`);
  }
  if (restHours > 0 || parts.length === 0) {
    parts.push(restHours === 1 ? '1 Stunde' : `${restHours} Stunden`);
  }

  return parts.join(' ');
}

interface MontagPreviewViewParams {
  serverName: string;
  nextMontagText: string;
  state: MontagSetupState;
}

export function baueMontagSetupView(params: MontagSetupViewParams): {
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
} {
  const {
    serverName,
    nextMontagText,
    gameCount,
    state,
    excludedGameNames = [],
  } = params;

  const multiText = state.allowMultiselect
    ? 'aktiv (Mehrfachauswahl)'
    : 'nur 1 Stimme pro Person';

  const dauerText = formatDurationText(state.durationHours);

  const excludedText =
    excludedGameNames.length > 0
      ? [
          '🚫 Ausgeschlossen (zuletzt als Gewinner):',
          excludedGameNames.map((n) => `• ${n}`).join('\n'),
        ].join('\n')
      : '🚫 Aktuell wird kein Spiel aufgrund der letzten Gewinner ausgeschlossen.';

  const embed = new EmbedBuilder()
    .setTitle('Montags-Runde – Setup')
    .setDescription(
      [
        `🕹 **Montags-Runde Setup für _${serverName}_**`,
        '',
        `📅 Geplante Session: **${nextMontagText}**`,
        `🎮 Verfügbare Spiele in der Datenbank: **${gameCount}**`,
        '',
        `🔁 Mehrfachauswahl: **${multiText}**`,
        `⏱ Dauer: **${dauerText}**`,
        '',
        excludedText,
        '',
        '➡ Klicke auf **„Umfrage vorbereiten“**, um eine zufällige Auswahl an Spielen zu generieren.',
      ].join('\n'),
    )
    .setColor(0x579326);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_prepare')
      .setStyle(ButtonStyle.Primary)
      .setLabel('Umfrage vorbereiten'),
    new ButtonBuilder()
      .setCustomId('poll_montag_add_game')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Spiel hinzufügen'),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

export function baueMontagPreviewView(params: MontagPreviewViewParams): {
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
} {
  const { serverName, nextMontagText, state } = params;

  const selectedText = state.selectedGames.length
    ? state.selectedGames
        .map((game, index) => {
          const details: string[] = [];
          if (game.isFree) details.push('F2P');
          if (game.maxPlayers != null) {
            details.push(`max. ${game.maxPlayers} Spieler`);
          }
          const suffix = details.length ? ` (_${details.join(' • ')}_)` : '';
          return `${index + 1}. **${game.name}**${suffix}`;
        })
        .join('\n')
    : '_Keine Spiele ausgewählt – bitte Setup anpassen._';

  const embed = new EmbedBuilder()
    .setTitle('Montags-Runde – Vorschau')
    .setDescription(
      [
        `🕹 **Montags-Runde Vorschau für _${serverName}_**`,
        '',
        `📅 Session: **${nextMontagText}**`,
        `🔁 Mehrfachauswahl: **${
          state.allowMultiselect ? 'aktiv' : 'nur 1 Stimme'
        }**`,
        `⏱ Dauer: **${formatDurationText(state.durationHours)}**`,
        '',
        '🎮 **Spiele in dieser Umfrage:**',
        selectedText,
      ].join('\n'),
    )
    .setColor(0x57f287);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_preview_back')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Zurück zum Setup'),
    new ButtonBuilder()
      .setCustomId('poll_montag_reroll')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Spiele neu würfeln'),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
