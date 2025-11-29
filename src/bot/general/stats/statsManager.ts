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

    // Sentinel-Check: nur bei explizitem Opt-in userId speichern
    const trackingStatus = await ermittleTrackingStatus(guildId, userId);
    const darfUserIdSpeichern = trackingStatus === 'allowed';

    await prisma.commandUsage.create({
      data: {
        commandName: interaction.commandName,
        guildId,
        channelId: interaction.channelId ?? null,
        userId: darfUserIdSpeichern && userId ? userId : null,
      },
    });

    logDebug('CommandUsage gespeichert', {
      functionName: 'trackCommandUsage',
      commandName: interaction.commandName,
      guildId: guildId ?? undefined,
      channelId: interaction.channelId ?? undefined,
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
