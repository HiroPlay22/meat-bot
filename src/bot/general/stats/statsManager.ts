// FILE: src/bot/general/stats/statsManager.ts

import type { ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../db/prismaClient.js';
import { logDebug, logError } from '../logging/logger.js';

export async function trackCommandUsage(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await prisma.commandUsage.create({
      data: {
        commandName: interaction.commandName,
        guildId: interaction.guildId ?? null,
        channelId: interaction.channelId ?? null,
        userId: interaction.user?.id ?? null,
      },
    });

    logDebug(`CommandUsage gespeichert: /${interaction.commandName}`, {
      functionName: 'trackCommandUsage',
      guildId: interaction.guildId ?? undefined,
      channelId: interaction.channelId ?? undefined,
      userId: interaction.user?.id ?? undefined,
      commandName: interaction.commandName,
    });
  } catch (error) {
    logError('Fehler beim Speichern des CommandUsage-Eintrags', {
      functionName: 'trackCommandUsage',
      guildId: interaction.guildId ?? undefined,
      channelId: interaction.channelId ?? undefined,
      userId: interaction.user?.id ?? undefined,
      commandName: interaction.commandName,
      extra: { error },
    });
  }
}
