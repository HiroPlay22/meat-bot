// FILE: src/bot/functions/sentinel/datenschutz/datenschutz.embeds.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { ladeTexte } from '../../../general/texts/text-loader.js';
import type { TrackingStatusTyp } from './datenschutz.service.js';

const texte = ladeTexte('sentinel/datenschutz', 'de');

// TODO: Später aus Konfiguration / Dashboard laden
const DATENSCHUTZ_URL = 'https://example.com/meat/datenschutz';

export function baueDatenschutzEmbedUndKomponenten(
  status: TrackingStatusTyp,
) {
  const embed = new EmbedBuilder().setTitle(texte.embed.title);

  const statusText =
    status === 'allowed'
      ? texte.embed.status.allowed
      : status === 'denied'
        ? texte.embed.status.denied
        : texte.embed.status.none;

  const beschreibung = `**${texte.embed.statusLabel}**\n${statusText}\n\n${texte.embed.description}`;

  embed.setDescription(beschreibung);

  // Buttons je nach Status
  const buttons: ButtonBuilder[] = [];

  if (status === 'none') {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('sentinel_datenschutz_allow')
        .setLabel(texte.buttons.allow)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('sentinel_datenschutz_deny')
        .setLabel(texte.buttons.deny)
        .setStyle(ButtonStyle.Secondary),
    );
  } else if (status === 'allowed') {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('sentinel_datenschutz_active')
        .setLabel(texte.buttons.active)
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('sentinel_datenschutz_revoke')
        .setLabel(texte.buttons.revoke)
        .setStyle(ButtonStyle.Danger),
    );
  } else if (status === 'denied') {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('sentinel_datenschutz_allow')
        .setLabel(texte.buttons.allow)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('sentinel_datenschutz_denied')
        .setLabel(texte.buttons.denied)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    );
  }

  // Link-Button zur externen Datenschutz-Seite
  buttons.push(
    new ButtonBuilder()
      .setLabel(texte.buttons.openPage)
      .setStyle(ButtonStyle.Link)
      .setURL(DATENSCHUTZ_URL),
  );

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    buttons,
  );

  return {
    embed,
    komponenten: [actionRow],
  };
}
