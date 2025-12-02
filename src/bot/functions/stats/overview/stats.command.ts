// FILE: src/bot/functions/stats/overview/stats.command.ts

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import type { SlashCommand } from '../../../types/SlashCommand.js';
import { ladeTexte } from '../../../general/texts/text-loader.js';
import { baueGuildStatsEmbed } from './stats.embeds.js';
import { prisma } from '../../../general/db/prismaClient.js';
import { logError, logInfo } from '../../../general/logging/logger.js';

const texte = ladeTexte('stats/overview', 'de');

type StatsView = 'guild' | 'commands' | 'montag' | 'me';

function baueStatsButtons(active: StatsView, guildLabel?: string) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('stats_view_guild')
      .setLabel(guildLabel ?? texte.buttons?.viewGuild ?? 'Allgemein')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === 'guild'),
    new ButtonBuilder()
      .setCustomId('stats_view_commands')
      .setLabel(texte.buttons?.viewCommands ?? 'Commands')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === 'commands'),
    new ButtonBuilder()
      .setCustomId('stats_view_montag')
      .setLabel('Montagsrunde')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === 'montag'),
    new ButtonBuilder()
      .setCustomId('stats_view_me')
      .setLabel(texte.buttons?.viewMe ?? 'Meine Stats')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === 'me'),
  );

  return row;
}

export const statsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(texte.command?.name ?? 'stats')
    .setDescription(
      texte.command?.description ??
        'Zeigt M.E.A.T.-Statistiken für diesen Discord-Server.',
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content:
          'Dieser Befehl funktioniert nur auf einem Discord-Server, nicht in DMs.',
        ephemeral: true,
      });
      return;
    }

      const guild = interaction.guild;
      const guildId = guild.id;

    try {
      // Basic Guild-Daten
      const memberCount = guild.memberCount ?? 0;
      const botCount = guild.members.cache.filter((m) => m.user.bot).size;

      const channels = guild.channels.cache;
      const textChannelCount = channels.filter((ch: any) =>
        ch.isTextBased?.(),
      ).size;
      const voiceChannelCount = channels.filter((ch: any) =>
        ch.isVoiceBased?.(),
      ).size;

      const roleCount = guild.roles.cache.size;

      // Aggregierte Command-Stats für diese Guild
      let totalCommandCount = 0;
      let topCommandName: string | undefined;
      let topCommandCount = 0;

      try {
        const rows =
          ((await (prisma as any).commandStatsGuildDaily.findMany({
            where: { guildId },
          })) as {
            commandName: string;
            totalCount: number;
          }[]) ?? [];

        for (const row of rows) {
          totalCommandCount += row.totalCount ?? 0;

          if (row.totalCount > topCommandCount) {
            topCommandCount = row.totalCount;
            topCommandName = row.commandName;
          }
        }
      } catch (error) {
        logError(
          'Fehler beim Lesen der CommandStatsGuildDaily für /stats',
          {
            functionName: 'statsCommand',
            guildId,
            extra: { error },
          },
        );
      }

      const embed = baueGuildStatsEmbed({
        guild,
        memberCount,
        botCount,
        textChannelCount,
        voiceChannelCount,
        roleCount,
        totalCommandCount,
        topCommandName,
        topCommandCount,
      });

      const buttons = baueStatsButtons('guild', guild.name);

      await interaction.reply({
        embeds: [embed],
        components: [buttons],
      });

      logInfo('/stats ausgeführt (View: Allgemein)', {
        functionName: 'statsCommand',
        guildId,
        userId: interaction.user.id,
      });
    } catch (error) {
      logError('Fehler im /stats-Command', {
        functionName: 'statsCommand',
        guildId,
        userId: interaction.user.id,
        extra: { error },
      });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            'Uff. Die Stats sind mir gerade explodiert. Hiro soll mal in die Logs schauen.',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            'Uff. Die Stats sind mir gerade explodiert. Hiro soll mal in die Logs schauen.',
          ephemeral: true,
        });
      }
    }
  },
};
