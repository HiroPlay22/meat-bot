// FILE: src/bot/functions/stats/overview/stats.buttons.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type ButtonInteraction,
  type GuildMember,
} from 'discord.js';
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
  STATS_ME_PUBLIC_BUTTON_ID,
  type StatsView,
  baueStatsButtons,
  baueStatsDatenschutzButtons,
} from './stats.components.js';
import { ermittleTrackingStatus } from '../../sentinel/datenschutz/datenschutz.service.js';
import { baueDatenschutzEmbedUndKomponenten } from '../../sentinel/datenschutz/datenschutz.embeds.js';
import { ladeMontagStats } from '../polls/montag/montag.stats.js';
import { ladeUserActivityTotals } from '../../../general/stats/activity.service.js';

type CommandStatItem = {
  commandName: string;
  count: number;
};

// Mapping von Button-ID â†’ View
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

// Aggregierte Befehls-Stats fÃ¼r einen User in einer Guild
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

// Ã–ffnet das Datenschutz-Panel (wie /datenschutz), ausgelÃ¶st aus /stats
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

    logInfo('Datenschutz-Panel aus /stats geÃ¶ffnet', {
      functionName: 'handleStatsDatenschutzOpen',
      guildId: guild.id,
      userId: interaction.user.id,
    });
  } catch (error) {
    logError('Fehler beim Ã–ffnen des Datenschutz-Panels (aus /stats)', {
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
 * Zentrale Handler-Funktion fÃ¼r alle /stats-Buttons.
 * Wird von index.ts aufgerufen.
 */
export async function handleStatsButtonInteraction(
  interaction: ButtonInteraction,
): Promise<void> {
  // Commands-Button aus /commands-Embed -> Command-Stats
  if (interaction.customId === 'commands_show_stats') {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Dieser Button funktioniert nur auf einem Server.',
        ephemeral: true,
      });
      return;
    }

    const items = await ladeGuildCommandStats(guild.id);
    const embed = baueCommandsStatsEmbed({ guild, items });
    const components = baueStatsButtons('commands', guild.name);

    await interaction.update({
      embeds: [embed],
      components,
    });

    logInfo('Commands-Stats aus /commands-Button geöffnet', {
      functionName: 'handleStatsButtonInteraction',
      guildId: guild.id,
      userId: interaction.user.id,
    });

    return;
  }
  // ðŸ”¹ Spezialfall: Datenschutz-Button aus "Meine Stats"
  if (interaction.customId === STATS_DATENSCHUTZ_BUTTON_ID) {
    await handleStatsDatenschutzOpen(interaction);
    return;
  }

  // Spezialfall: eigene Stats Ã¶ffentlich posten
  if (interaction.customId === STATS_ME_PUBLIC_BUTTON_ID) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Dieser Button funktioniert nur auf einem Server.',
        ephemeral: true,
      });
      return;
    }

    try {
      const trackingStatus = await ermittleTrackingStatus(
        guild.id,
        interaction.user.id,
      );

      if (trackingStatus !== 'allowed') {
        await interaction.reply({
          content:
            'Deine Statistiken dÃ¼rfen nicht geteilt werden (kein Opt-in).',
          ephemeral: true,
        });
        return;
      }

      const items = await ladeMeineCommandStats(
        guild.id,
        interaction.user.id,
      );
      const activityTotals = await ladeUserActivityTotals({
        guildId: guild.id,
        userId: interaction.user.id,
      });

      let member: GuildMember | null = null;
      try {
        member = await guild.members.fetch(interaction.user.id);
      } catch {
        // best effort
      }

      const embed = baueMeineStatsEmbed({
        user: interaction.user,
        member: member ?? undefined,
        trackingStatus,
        items,
        activity: activityTotals,
      });

      await interaction.deferUpdate();

      const outChannel = interaction.channel;
      if (outChannel && outChannel.isTextBased()) {
        await (outChannel as any).send({ embeds: [embed] });
      } else {
        await interaction.followUp({
          content: 'Konnte keinen Text-Channel fÃ¼r die Ausgabe finden.',
          ephemeral: true,
        });
        return;
      }

      try {
        await interaction.deleteReply();
      } catch {
        // best effort
      }
    } catch (error) {
      logError('Fehler beim Ã¶ffentlichen Posten der Meine-Stats', {
        functionName: 'handleStatsButtonInteraction',
        guildId: interaction.guildId ?? undefined,
        userId: interaction.user.id,
        extra: { error },
      });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            'Konnte deine Stats nicht Ã¶ffentlich posten. Versuch es nochmal.',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            'Konnte deine Stats nicht Ã¶ffentlich posten. Versuch es nochmal.',
          ephemeral: true,
        });
      }
    }

    return;
  }

  const view = ermittleViewAusCustomId(interaction.customId);
  if (!view) {
    // Nicht unser Button â†’ ignorieren.
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

    // ðŸ”¹ View: Allgemein â†’ Haupt-Embed updaten
    if (view === 'guild') {
      // volle Memberliste laden, damit Bots/Member zuverlÃ¤ssig gezÃ¤hlt werden
      const memberCollection = await guild.members.fetch();

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
        botCount: memberCollection.filter((m) => m.user.bot).size,
        textChannelCount,
        voiceChannelCount,
        roleCount: guild.roles.cache.size,
      });

      const components = baueStatsButtons('guild', guild.name);

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

      const components = baueStatsButtons('montag', guild.name);

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

    // ðŸ”¹ View: Commands â†’ Haupt-Embed updaten
    if (view === 'commands') {
      const items = await ladeGuildCommandStats(guild.id);

      const embed = baueCommandsStatsEmbed({
        guild,
        items,
      });

      const components = baueStatsButtons('commands', guild.name);

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

    // ðŸ”¹ View: Meine Stats â†’ nur ephemeres Embed, Hauptnachricht bleibt
    if (view === 'me') {
      const items =
        trackingStatus === 'allowed'
          ? await ladeMeineCommandStats(guild.id, interaction.user.id)
          : [];
      const activityTotals =
        trackingStatus === 'allowed'
          ? await ladeUserActivityTotals({
              guildId: guild.id,
              userId: interaction.user.id,
            })
          : { messageCount: 0, voiceSeconds: 0 };

      let member: GuildMember | null = null;
      try {
        member = await guild.members.fetch(interaction.user.id);
      } catch {
        // best effort
      }

      const embed = baueMeineStatsEmbed({
        user: interaction.user,
        member: member ?? undefined,
        trackingStatus,
        items,
        activity: activityTotals,
      });

      // Hauptnachricht bleibt unverÃ¤ndert â†’ nur Interaction bestÃ¤tigen
      await interaction.deferUpdate();

      let componentsForMeView =
        trackingStatus === 'allowed'
          ? [] // Tracking erlaubt -> keine extra Buttons nÃ¶tig
          : baueStatsDatenschutzButtons(); // Kein Opt-in -> Datenschutz-Button anzeigen

      if (trackingStatus === 'allowed') {
        componentsForMeView = [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(STATS_ME_PUBLIC_BUTTON_ID)
              .setLabel('Öffentlich anzeigen')
              .setStyle(ButtonStyle.Secondary),
          ),
        ];
      }

      await interaction.followUp({
        embeds: [embed],
        components: componentsForMeView,
        ephemeral: true,
      });

      logInfo('Stats-View geÃ¶ffnet: me (ephemeral)', {
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

