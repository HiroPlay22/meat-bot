// FILE: src/bot/functions/polls/poll.embeds.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

export function bauePollCenterView(serverName: string): {
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
} {
  const embed = new EmbedBuilder()
    .setTitle('M.E.A.T. // Poll-Center')
    .setDescription(
      [
        `Willkommen im Poll-Center von **${serverName}**.`,
        '',
        'Wähle einen Poll-Typ aus, um eine Umfrage vorzubereiten.',
        '',
        '- **Montags-Runde** – Was wird am nächsten Montag gezockt?',
        '',
        'Die Einrichtung läuft Schritt für Schritt über Buttons & Modals,',
        'bis am Ende ein **nativer Discord-Poll** erstellt wird.',
      ].join('\n'),
    )
    .setColor(0x5865f2);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_type_montag')
      .setLabel('Montags-Runde')
      .setStyle(ButtonStyle.Primary),
  );

  return { embed, components: [row] };
}
