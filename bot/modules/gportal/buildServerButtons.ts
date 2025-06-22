// bot/modules/gportal/buildServerButtons.ts

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { GportalServerConfig } from './types.js';

/**
 * Erzeugt Buttons unterhalb eines Server-Embeds:
 * - [Mods] (wenn link vorhanden)
 * - [Mods anzeigen] (wenn modIds vorhanden, aber kein link)
 * - [🎁 10 % auf deinen Gameserver] (immer)
 * - [Zurück] (immer)
 */
export function buildServerButtons(config: GportalServerConfig) {
  const buttons: ButtonBuilder[] = [];

  // Falls Mod-Link vorhanden
  if (config.link) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('Mods')
        .setStyle(ButtonStyle.Link)
        .setURL(config.link)
    );
  }

  // Falls Mod-IDs vorhanden aber kein Link → Button für Modal
  if (!config.link && config.modIds?.length) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`show_mods_${config.id}`)
        .setLabel('Mods anzeigen')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  // Immer: Ref-Link zu GPORTAL
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
