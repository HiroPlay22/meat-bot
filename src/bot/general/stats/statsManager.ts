// FILE: src/bot/general/stats/statsManager.ts

import type { ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../db/prismaClient.js';
import { logDebug, logError } from '../logging/logger.js';
import { ermittleTrackingStatus } from '../../functions/sentinel/datenschutz/datenschutz.service.js';

export async function trackCommandUsage(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    const guildId = interaction.guildId ?? null;
    const userId = interaction.user?.id ?? null;
    const commandName = interaction.commandName;
    const channelId = interaction.channelId ?? null;

    // Sentinel-Check: nur bei explizitem Opt-in userId speichern
    const trackingStatus = await ermittleTrackingStatus(guildId, userId);
    const darfUserIdSpeichern = trackingStatus === 'allowed';

    // 1) Raw-Event in CommandUsage schreiben (Log/Debug/Timeline)
    await prisma.commandUsage.create({
      data: {
        commandName,
        guildId,
        channelId,
        userId: darfUserIdSpeichern && userId ? userId : null,
      },
    });

    // 2) Aggregierte Daily-Stats pro Guild & Command hochzählen
    // Nur wenn wir eine GuildId haben (DMs o.ä. ignorieren wir hier)
    if (guildId) {
      const heute = new Date();
      // Tages-Schlüssel: UTC-Midnight (können wir später bei Bedarf auf eine andere Zone umstellen)
      heute.setUTCHours(0, 0, 0, 0);

      try {
        await (prisma as any).commandStatsGuildDaily.upsert({
          where: {
            date_guildId_commandName: {
              date: heute,
              guildId,
              commandName,
            },
          },
          update: {
            totalCount: {
              increment: 1,
            },
          },
          create: {
            date: heute,
            guildId,
            commandName,
            totalCount: 1,
          },
        });

        logDebug('CommandStatsGuildDaily hochgezählt', {
          functionName: 'trackCommandUsage',
          commandName,
          guildId,
        });
      } catch (error) {
        // Wenn die Aggregation fehlschlägt, soll das den Command selbst nicht killen
        logError('Fehler beim Hochzählen von CommandStatsGuildDaily', {
          functionName: 'trackCommandUsage',
          commandName,
          guildId,
          extra: { error },
        });
      }
    }

    logDebug('CommandUsage gespeichert', {
      functionName: 'trackCommandUsage',
      commandName,
      guildId: guildId ?? undefined,
      channelId: channelId ?? undefined,
      userId: userId ?? undefined,
    });
  } catch (error) {
    logError('Fehler beim Speichern des CommandUsage-Eintrags', {
      functionName: 'trackCommandUsage',
      commandName: interaction.commandName,
      extra: { error },
    });
  }
}
