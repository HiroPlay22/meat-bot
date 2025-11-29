// FILE: src/bot/functions/sentinel/datenschutz/datenschutz.service.ts

import { prisma } from '../../../general/db/prismaClient.js';
import { logError, logInfo } from '../../../general/logging/logger.js';

export type TrackingStatusTyp = 'none' | 'allowed' | 'denied';

// Entspricht dem Enum in prisma/schema.prisma
type PrismaTrackingStatusString = 'NONE' | 'ALLOWED' | 'DENIED';

// Umwandlung zwischen Prisma-Enum-String & internem Typ
function prismaStatusZuIntern(
  status: PrismaTrackingStatusString | null | undefined,
): TrackingStatusTyp {
  switch (status) {
    case 'ALLOWED':
      return 'allowed';
    case 'DENIED':
      return 'denied';
    case 'NONE':
    default:
      return 'none';
  }
}

function internerStatusZuPrisma(
  status: TrackingStatusTyp,
): PrismaTrackingStatusString {
  switch (status) {
    case 'allowed':
      return 'ALLOWED';
    case 'denied':
      return 'DENIED';
    case 'none':
    default:
      return 'NONE';
  }
}

/**
 * Liefert den aktuellen Tracking-Status eines Users auf einem Server.
 * Wenn keine Einwilligung gespeichert ist oder guildId/userId fehlen → "none".
 */
export async function ermittleTrackingStatus(
  guildId: string | null,
  userId: string | null,
): Promise<TrackingStatusTyp> {
  if (!guildId || !userId) {
    return 'none';
  }

  try {
    // kleiner TS-Bypass: Prisma-Client hat das Modell, aber Typescript kennt es evtl. noch nicht
    const consentClient = (prisma as any).userTrackingConsent;

    const eintrag = (await consentClient.findFirst({
      where: {
        guildId,
        userId,
      },
    })) as { status: PrismaTrackingStatusString } | null;

    if (!eintrag) {
      return 'none';
    }

    return prismaStatusZuIntern(eintrag.status);
  } catch (error) {
    logError('Fehler beim Lesen des Tracking-Status', {
      functionName: 'ermittleTrackingStatus',
      guildId,
      userId,
      extra: { error },
    });
    return 'none';
  }
}

/**
 * Setzt den Tracking-Status eines Users auf einem Server.
 */
export async function setzeTrackingStatus(
  guildId: string,
  userId: string,
  status: TrackingStatusTyp,
  version?: string,
): Promise<void> {
  const prismaStatus = internerStatusZuPrisma(status);

  try {
    const consentClient = (prisma as any).userTrackingConsent;

    const vorhandener = (await consentClient.findFirst({
      where: {
        guildId,
        userId,
      },
    })) as { id: string } | null;

    if (vorhandener) {
      await consentClient.update({
        where: { id: vorhandener.id },
        data: {
          status: prismaStatus,
          version: version ?? undefined,
        },
      });
    } else {
      await consentClient.create({
        data: {
          guildId,
          userId,
          status: prismaStatus,
          version: version ?? undefined,
        },
      });
    }

    logInfo('Tracking-Status aktualisiert', {
      functionName: 'setzeTrackingStatus',
      guildId,
      userId,
      extra: { status },
    });
  } catch (error) {
    logError('Fehler beim Setzen des Tracking-Status', {
      functionName: 'setzeTrackingStatus',
      guildId,
      userId,
      extra: { status, error },
    });
    throw error;
  }
}
