// FILE: src/bot/functions/stats/overview/stats.components.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export type StatsView = 'guild' | 'commands' | 'montag' | 'me';

export const STATS_BUTTON_IDS = {
  GUILD: 'stats_view_guild',
  COMMANDS: 'stats_view_commands',
  MONTAG: 'stats_view_montag',
  ME: 'stats_view_me',
} as const;

// Extra-Button für "Datenschutz öffnen" in "Meine Stats" (nur bei fehlendem Opt-in)
export const STATS_DATENSCHUTZ_BUTTON_ID = 'stats_open_datenschutz';

/**
 * Baut die Tab-Buttons für /stats:
 * - Allgemein
 * - Commands
 * - Meine Stats
 *
 * Der aktive Tab ist disabled.
 */
export function baueStatsButtons(
  activeView: StatsView,
  guildLabel?: string,
): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(STATS_BUTTON_IDS.GUILD)
      .setLabel(guildLabel ?? 'Allgemein')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activeView === 'guild'),

    new ButtonBuilder()
      .setCustomId(STATS_BUTTON_IDS.COMMANDS)
      .setLabel('Commands')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activeView === 'commands'),

    new ButtonBuilder()
      .setCustomId(STATS_BUTTON_IDS.MONTAG)
      .setLabel('Montagsrunde')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activeView === 'montag'),

    new ButtonBuilder()
      .setCustomId(STATS_BUTTON_IDS.ME)
      .setLabel('Meine Stats')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activeView === 'me'),
  );

  return [row];
}

/**
 * Button-Reihe für "Datenschutz öffnen", die nur in "Meine Stats"
 * angezeigt wird, wenn kein Tracking-Opt-in vorhanden ist.
 */
export function baueStatsDatenschutzButtons(): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(STATS_DATENSCHUTZ_BUTTON_ID)
      .setLabel('Datenschutzeinstellungen')
      .setStyle(ButtonStyle.Primary),
  );

  return [row];
}
