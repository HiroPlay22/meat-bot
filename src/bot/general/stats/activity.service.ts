// FILE: src/bot/general/stats/activity.service.ts

import { prisma } from '../db/prismaClient.js';
import { ermittleTrackingStatus } from '../../functions/sentinel/datenschutz/datenschutz.service.js';
import { logError } from '../logging/logger.js';

function utcDateKey(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function trackMessageActivity(params: {
  guildId: string | null;
  userId: string | null;
}): Promise<void> {
  const { guildId, userId } = params;
  const today = utcDateKey(new Date());

  const trackingStatus = await ermittleTrackingStatus(guildId, userId);
  const darfUserId = trackingStatus === 'allowed' && !!userId;

  try {
    await prisma.userActivityDaily.upsert({
      where: {
        date_guild_user: {
          date: today,
          guildId: guildId ?? null,
          userId: darfUserId ? userId! : null,
        },
      },
      update: {
        messageCount: { increment: 1 },
      },
      create: {
        date: today,
        guildId: guildId ?? null,
        userId: darfUserId ? userId! : null,
        messageCount: 1,
      },
    });
  } catch (error) {
    logError('Fehler beim Tracking von Message-Aktivität', {
      functionName: 'trackMessageActivity',
      extra: { error, guildId, userId },
    });
  }
}

export async function addVoiceSeconds(params: {
  guildId: string | null;
  userId: string | null;
  seconds: number;
}): Promise<void> {
  const { guildId, userId, seconds } = params;
  if (!seconds || seconds <= 0) return;

  const today = utcDateKey(new Date());

  const trackingStatus = await ermittleTrackingStatus(guildId, userId);
  const darfUserId = trackingStatus === 'allowed' && !!userId;

  try {
    await prisma.userActivityDaily.upsert({
      where: {
        date_guild_user: {
          date: today,
          guildId: guildId ?? null,
          userId: darfUserId ? userId! : null,
        },
      },
      update: {
        voiceSeconds: { increment: Math.round(seconds) },
      },
      create: {
        date: today,
        guildId: guildId ?? null,
        userId: darfUserId ? userId! : null,
        voiceSeconds: Math.round(seconds),
      },
    });
  } catch (error) {
    logError('Fehler beim Tracking von Voice-Aktivität', {
      functionName: 'addVoiceSeconds',
      extra: { error, guildId, userId },
    });
  }
}

export async function ladeUserActivityTotals(params: {
  guildId: string;
  userId: string;
}): Promise<{ messageCount: number; voiceSeconds: number }> {
  const { guildId, userId } = params;
  const rows = await prisma.userActivityDaily.findMany({
    where: { guildId, userId },
    select: { messageCount: true, voiceSeconds: true },
  });

  return rows.reduce(
    (
      acc: { messageCount: number; voiceSeconds: number },
      row: { messageCount: number; voiceSeconds: number },
    ) => {
      acc.messageCount += row.messageCount ?? 0;
      acc.voiceSeconds += row.voiceSeconds ?? 0;
      return acc;
    },
    { messageCount: 0, voiceSeconds: 0 },
  );
}
