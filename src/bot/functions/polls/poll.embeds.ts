// FILE: src/bot/functions/polls/poll.embeds.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

export function bauePollCenterView(
  serverName: string,
): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
  const embed = new EmbedBuilder()
    .setTitle('M.E.A.T. Poll-Center')
    .setDescription(
      [
        `Willkommen im Umfrage-Hub von **${serverName}**.`,
        '',
        'Wähle einen Poll-Typ aus, den du konfigurieren möchtest.',
      ].join('\n'),
    )
    .setColor(0x5865f2);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_type_montag')
      .setStyle(ButtonStyle.Primary)
      .setLabel('Montags-Runde'),
  );

  return {
    embed,
    components: [row],
  };
}
