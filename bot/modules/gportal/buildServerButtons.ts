import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { GportalServerConfig } from './types.js';

/**
 * Erzeugt Buttons unterhalb eines Server-Embeds:
 * - [Mods] (optional)
 * - [Zurück]
 */
export function buildServerButtons(config: GportalServerConfig) {
  const buttons: ButtonBuilder[] = [];

  // Button für Mods (falls Link vorhanden)
  if (config.link) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('Mods')
        .setStyle(ButtonStyle.Link)
        .setURL(config.link)
    );
  }

  // Zurück-Button (immer)
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`back_to_server_list`)
      .setLabel('Zurück')
      .setStyle(ButtonStyle.Secondary)
  );

  // Rückgabe: max. 5 Buttons pro Row erlaubt – wir haben max. 2
  return [new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)];
}
