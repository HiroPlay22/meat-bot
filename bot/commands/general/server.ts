// bot/commands/general/server.ts

import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction
} from 'discord.js';

import { loadGportalSettings } from '@/modules/gportal/loadGportalSettings.js';
import { buildServerOverviewEmbed } from '@/modules/gportal/buildServerOverviewEmbed.js';
import { queryServer } from '@/modules/gportal/queryServer.js';
import { buildServerInfoEmbed } from '@/modules/gportal/buildServerInfoEmbed.js';
import { buildServerButtons } from '@/modules/gportal/buildServerButtons.js';

const gameIcons: Record<string, string> = {
  ark: '🦖',
  valheim: '🧊',
  palworld: '🐲',
  minecraft: '🧱',
  default: '🎮'
};

export const data = new SlashCommandBuilder()
  .setName('server')
  .setDescription('Zeigt Community-Server');

export async function execute(interaction: ChatInputCommandInteraction) {
  const servers = loadGportalSettings();
  const embed = buildServerOverviewEmbed();

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();

  for (const server of servers) {
    const icon = gameIcons[server.type] || gameIcons.default;
    const labelRaw = `${icon} ${server.name}`;
    const label = labelRaw.length > 80 ? labelRaw.slice(0, 77) + '…' : labelRaw;

    let button: ButtonBuilder;

    if (server.query) {
      const live = await queryServer(server);

      button = new ButtonBuilder()
        .setCustomId(
          live ? `view_server_${server.id}` : `offline_placeholder_${server.id}`
        )
        .setLabel(live ? label : `❌ ${server.name}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!live);
    } else {
      button = new ButtonBuilder()
        .setCustomId(`view_server_${server.id}`)
        .setLabel(label)
        .setStyle(ButtonStyle.Secondary);
    }

    currentRow.addComponents(button);

    if (currentRow.components.length >= 2) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<ButtonBuilder>();
    }
  }

  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }

  // ➕ Ref-Link Button, falls noch Platz
  if (rows.length < 5) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('🎁 10 % Rabatt auf deinen Gameserver')
          .setStyle(ButtonStyle.Link)
          .setURL('https://www.g-portal.com/?ref=HiroLive')
      )
    );
  }

  return interaction.reply({
    embeds: [embed],
    components: rows,
    ephemeral: false
  });
}
