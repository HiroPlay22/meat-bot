import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { GportalServerConfig } from './types.js';

/**
 * Erzeugt Buttons unterhalb eines Server-Embeds:
 * - [Mods] (optional, wenn Link vorhanden)
 * - [10 % auf deinen Gameserver] (immer)
 * - [Zurück zur Übersicht] (immer)
 */
export function buildServerButtons(config: GportalServerConfig) {
  const buttons: ButtonBuilder[] = [];

  // Optionaler Mods-Link
  if (config.link) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('Mods')
        .setStyle(ButtonStyle.Link)
        .setURL(config.link)
    );
  }

  // Immer: Ref-Link zu GPORTAL (10 % Rabatt)
  buttons.push(
    new ButtonBuilder()
      .setLabel('🎁 10 % auf deinen Gameserver')
      .setStyle(ButtonStyle.Link)
      .setURL('https://www.g-portal.com/?ref=HiroLive')
  );

  // Immer: Zurück zur Übersicht
  buttons.push(
    new ButtonBuilder()
      .setCustomId('back_to_overview')
      .setLabel('Zurück')
      .setStyle(ButtonStyle.Secondary)
  );

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)];
}
