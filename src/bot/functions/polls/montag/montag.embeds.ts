// FILE: src/bot/functions/polls/montag/montag.embeds.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import type { MontagPollSetupState, MontagGame } from './montag.service.js';

interface SetupViewParams {
  serverName: string;
  nextMontagText: string;
  gameCount: number;
  state: MontagPollSetupState;
}

interface PreviewViewParams {
  serverName: string;
  nextMontagText: string;
  state: MontagPollSetupState;
}

/**
 * Haupt-Setup-View für die Montags-Runde.
 */
export function baueMontagSetupView(
  params: SetupViewParams,
): {
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
} {
  const { serverName, nextMontagText, gameCount, state } = params;

  const embed = new EmbedBuilder()
    .setTitle('Montags-Runde – Setup')
    .setDescription(
      [
        `Du konfigurierst gerade die **Montags-Runde** auf **${serverName}**.`,
        '',
        `🗓️ Nächster Termin (geplant): **${nextMontagText}**`,
        '',
        `🎮 Verfügbare Spiele im Pool: **${gameCount}**`,
        '',
        `✅ Mehrfachauswahl: **${state.allowMultiselect ? 'aktiv' : 'deaktiviert'}**`,
        `⏱️ Laufzeit (derzeit): **${state.durationHours}h**`,
        '',
        '• Mit **"Umfrage vorbereiten"** würfelt M.E.A.T. eine Spielauswahl für die Umfrage.',
        '• Mit **"Native Poll starten"** wird am Ende ein **echter Discord-Poll** erstellt.',
      ].join('\n'),
    )
    .setColor(0x2b2d31);

  const rowMain = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_center_back')
      .setLabel('Zurück zum Poll-Center')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('poll_montag_prepare')
      .setLabel('Umfrage vorbereiten')
      .setStyle(ButtonStyle.Primary),
  );

  const rowGames = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_add_game')
      .setLabel('Spiel hinzufügen')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('poll_montag_remove_game')
      .setLabel('Spiel entfernen')
      .setStyle(ButtonStyle.Danger),
  );

  const rowOptions = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_toggle_multiselect')
      .setLabel(
        state.allowMultiselect
          ? 'Mehrfachauswahl deaktivieren'
          : 'Mehrfachauswahl aktivieren',
      )
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('poll_montag_duration_dec')
      .setLabel('- 1h')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('poll_montag_duration_inc')
      .setLabel('+ 1h')
      .setStyle(ButtonStyle.Secondary),
  );

  return {
    embed,
    components: [rowMain, rowGames, rowOptions],
  };
}

/**
 * Preview-View: zeigt die ausgewählten Spiele, bevor der native Poll erstellt wird.
 */
export function baueMontagPreviewView(
  params: PreviewViewParams,
): {
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
} {
  const { serverName, nextMontagText, state } = params;

  const games: MontagGame[] = state.selectedGames;

  const beschreibungTeile: string[] = [
    `Vorschau für die **Montags-Runde** auf **${serverName}**.`,
    '',
    `🗓️ Termin: **${nextMontagText}**`,
    `✅ Mehrfachauswahl: **${state.allowMultiselect ? 'aktiv' : 'deaktiviert'}**`,
    `⏱️ Laufzeit: **${state.durationHours}h**`,
    '',
    'Folgende Spiele würden im **nativen Poll** erscheinen:',
    '',
  ];

  if (!games.length) {
    beschreibungTeile.push(
      '_Noch keine Spiele ausgewählt. Bitte einmal "Umfrage vorbereiten" drücken._',
    );
  } else {
    games.forEach((game, index) => {
      const freeText = game.isFree ? 'free' : 'paid';
      const playersText =
        game.minPlayers && game.maxPlayers
          ? `${game.minPlayers}-${game.maxPlayers} Spieler`
          : game.maxPlayers
            ? `max. ${game.maxPlayers} Spieler`
            : game.minPlayers
              ? `mind. ${game.minPlayers} Spieler`
              : 'Spielerzahl flexibel';

      beschreibungTeile.push(
        `**${index + 1}. ${game.name}** – ${playersText}, ${freeText}`,
      );
    });
  }

  beschreibungTeile.push(
    '',
    'Du kannst noch **rerollen**, zurück ins Setup gehen oder den **nativen Poll starten**.',
  );

  const embed = new EmbedBuilder()
    .setTitle('Montags-Runde – Vorschau (native Poll)')
    .setDescription(beschreibungTeile.join('\n'))
    .setColor(0x5865f2);

  const rowMain = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_preview_back')
      .setLabel('Zurück zum Setup')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('poll_montag_reroll')
      .setLabel('Reroll Spiele')
      .setStyle(ButtonStyle.Secondary),
  );

  const rowStart = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_start')
      .setLabel('Native Poll starten')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('poll_montag_cancel')
      .setLabel('Abbrechen')
      .setStyle(ButtonStyle.Danger),
  );

  return {
    embed,
    components: [rowMain, rowStart],
  };
}
