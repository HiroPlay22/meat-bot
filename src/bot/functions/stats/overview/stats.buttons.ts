// FILE: src/bot/functions/stats/overview/stats.buttons.ts

import { ChannelType, type ButtonInteraction } from 'discord.js';
import { prisma } from '../../../general/db/prismaClient.js';
import { logError, logInfo } from '../../../general/logging/logger.js';
import {
  baueGuildStatsEmbed,
  baueCommandsStatsEmbed,
  baueMeineStatsEmbed,
  baueMontagStatsEmbed,
} from './stats.embeds.js';
import {
  STATS_BUTTON_IDS,
  STATS_DATENSCHUTZ_BUTTON_ID,
  type StatsView,
  baueStatsButtons,
  baueStatsDatenschutzButtons,
} from './stats.components.js';
import { ermittleTrackingStatus } from '../../sentinel/datenschutz/datenschutz.service.js';
import { baueDatenschutzEmbedUndKomponenten } from '../../sentinel/datenschutz/datenschutz.embeds.js';
import { ladeMontagStats } from '../polls/montag/montag.stats.js';

type CommandStatItem = {
  commandName: string;
  count: number;
};

// Mapping von Button-ID → View
function ermittleViewAusCustomId(customId: string): StatsView | null {
  switch (customId) {
    case STATS_BUTTON_IDS.GUILD:
      return 'guild';
    case STATS_BUTTON_IDS.COMMANDS:
      return 'commands';
    case STATS_BUTTON_IDS.MONTAG:
      return 'montag';
    case STATS_BUTTON_IDS.ME:
      return 'me';
    default:
      return null;
  }
}

// Aggregierte Befehls-Stats pro Guild
async function ladeGuildCommandStats(
  guildId: string,
): Promise<CommandStatItem[]> {
  const rows = await prisma.commandUsage.groupBy({
    by: ['commandName'],
    where: {
      guildId,
    },
    _count: {
      _all: true,
    },
  });

  return rows
    .map(
      (row: {
        commandName: string;
        _count: { _all: number };
      }): CommandStatItem => ({
        commandName: row.commandName,
        count: row._count._all,
      }),
    )
    .sort(
      (a: CommandStatItem, b: CommandStatItem): number =>
        b.count - a.count,
    );
}

// Aggregierte Befehls-Stats für einen User in einer Guild
async function ladeMeineCommandStats(
  guildId: string,
  userId: string,
): Promise<CommandStatItem[]> {
  const rows = await prisma.commandUsage.groupBy({
    by: ['commandName'],
    where: {
      guildId,
      userId,
    },
    _count: {
      _all: true,
    },
  });

  return rows
    .map(
      (row: {
        commandName: string;
        _count: { _all: number };
      }): CommandStatItem => ({
        commandName: row.commandName,
        count: row._count._all,
      }),
    )
    .sort(
      (a: CommandStatItem, b: CommandStatItem): number =>
        b.count - a.count,
    );
}

// Öffnet das Datenschutz-Panel (wie /datenschutz), ausgelöst aus /stats
async function handleStatsDatenschutzOpen(
  interaction: ButtonInteraction,
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Dieser Button funktioniert nur auf einem Server.',
        ephemeral: true,
      });
    }
    return;
  }

  try {
    const status = await ermittleTrackingStatus(
      guild.id,
      interaction.user.id,
    );

    const { embed, komponenten } =
      baueDatenschutzEmbedUndKomponenten(status);

    await interaction.reply({
      embeds: [embed],
      components: komponenten,
      ephemeral: true,
    });

    logInfo('Datenschutz-Panel aus /stats geöffnet', {
      functionName: 'handleStatsDatenschutzOpen',
      guildId: guild.id,
      userId: interaction.user.id,
    });
  } catch (error) {
    logError('Fehler beim Öffnen des Datenschutz-Panels (aus /stats)', {
      functionName: 'handleStatsDatenschutzOpen',
      guildId: interaction.guildId ?? undefined,
      userId: interaction.user.id,
      extra: { error },
    });

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content:
          'Uff. Da ist was mit dem Datenschutz-Panel schiefgelaufen.',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          'Uff. Da ist was mit dem Datenschutz-Panel schiefgelaufen.',
        ephemeral: true,
      });
    }
  }
}

/**
 * Zentrale Handler-Funktion für alle /stats-Buttons.
 * Wird von index.ts aufgerufen.
 */
export async function handleStatsButtonInteraction(
  interaction: ButtonInteraction,
): Promise<void> {
  // 🔹 Spezialfall: Datenschutz-Button aus "Meine Stats"
  if (interaction.customId === STATS_DATENSCHUTZ_BUTTON_ID) {
    await handleStatsDatenschutzOpen(interaction);
    return;
  }

  const view = ermittleViewAusCustomId(interaction.customId);
  if (!view) {
    // Nicht unser Button → ignorieren.
    return;
  }

  const guild = interaction.guild;
  if (!guild) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Dieser Button funktioniert nur auf einem Server.',
        ephemeral: true,
      });
    }
    return;
  }

  try {
    const trackingStatus = await ermittleTrackingStatus(
      guild.id,
      interaction.user.id,
    );

    // 🔹 View: Allgemein → Haupt-Embed updaten
    if (view === 'guild') {
      const textChannelCount = guild.channels.cache.filter(
        (channel) =>
          channel.type === ChannelType.GuildText ||
          channel.type === ChannelType.GuildAnnouncement ||
          channel.type === ChannelType.GuildForum,
      ).size;

      const voiceChannelCount = guild.channels.cache.filter(
        (channel) =>
          channel.type === ChannelType.GuildVoice ||
          channel.type === ChannelType.GuildStageVoice,
      ).size;

      const embed = baueGuildStatsEmbed({
        guild,
        memberCount: guild.memberCount,
        botCount: guild.members.cache.filter((m) => m.user.bot).size,
        textChannelCount,
        voiceChannelCount,
        roleCount: guild.roles.cache.size,
      });

      const components = baueStatsButtons('guild');

      await interaction.update({
        embeds: [embed],
        components,
      });

      logInfo('Stats-View gewechselt: guild', {
        functionName: 'handleStatsButtonInteraction',
        guildId: guild.id,
        userId: interaction.user.id,
      });
      return;
    }

    if (view === 'montag') {
      const stats = await ladeMontagStats(guild.id);

      const embed = baueMontagStatsEmbed({
        guild,
        stats,
      });

      const components = baueStatsButtons('montag');

      await interaction.update({
        embeds: [embed],
        components,
      });

      logInfo('Stats-View gewechselt: montag', {
        functionName: 'handleStatsButtonInteraction',
        guildId: guild.id,
        userId: interaction.user.id,
      });
      return;
    }

    // 🔹 View: Commands → Haupt-Embed updaten
    if (view === 'commands') {
      const items = await ladeGuildCommandStats(guild.id);

      const embed = baueCommandsStatsEmbed({
        guild,
        items,
      });

      const components = baueStatsButtons('commands');

      await interaction.update({
        embeds: [embed],
        components,
      });

      logInfo('Stats-View gewechselt: commands', {
        functionName: 'handleStatsButtonInteraction',
        guildId: guild.id,
        userId: interaction.user.id,
      });
      return;
    }

    // 🔹 View: Meine Stats → nur ephemeres Embed, Hauptnachricht bleibt
    if (view === 'me') {
      const items =
        trackingStatus === 'allowed'
          ? await ladeMeineCommandStats(guild.id, interaction.user.id)
          : [];

      const embed = baueMeineStatsEmbed({
        user: interaction.user,
        trackingStatus,
        items,
      });

      // Hauptnachricht bleibt unverändert → nur Interaction bestätigen
      await interaction.deferUpdate();

      const componentsForMeView =
        trackingStatus === 'allowed'
          ? [] // Tracking erlaubt → keine extra Buttons nötig
          : baueStatsDatenschutzButtons(); // Kein Opt-in → Datenschutz-Button anzeigen

      await interaction.followUp({
        embeds: [embed],
        components: componentsForMeView,
        ephemeral: true,
      });

      logInfo('Stats-View geöffnet: me (ephemeral)', {
        functionName: 'handleStatsButtonInteraction',
        guildId: guild.id,
        userId: interaction.user.id,
      });
      return;
    }
  } catch (error) {
    logError('Fehler im Stats-Button-Handler', {
      functionName: 'handleStatsButtonInteraction',
      guildId: interaction.guildId ?? undefined,
      userId: interaction.user.id,
      extra: { error },
    });

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content:
          'Uff. Irgendwas ist mit den Stats schiefgelaufen. Versuch es gleich nochmal.',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          'Uff. Irgendwas ist mit den Stats schiefgelaufen. Versuch es gleich nochmal.',
      });
    }
  }
}
