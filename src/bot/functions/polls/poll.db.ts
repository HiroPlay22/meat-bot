// FILE: src/bot/functions/polls/poll.db.ts

import type { Poll, PollGame } from '@prisma/client';
import { PollType } from '@prisma/client';
import { prisma } from '../../general/db/prisma.js';

/**
 * Findet den aktuell laufenden Montags-Poll (falls vorhanden).
 */
export async function findeAktivenMontagPoll(
  guildId: string,
): Promise<Poll | null> {
  return prisma.poll.findFirst({
    where: {
      guildId,
      type: PollType.MONTAG,
      endedAt: null,
    },
  });
}

export async function findeMontagPollByMessage(
  messageId: string,
): Promise<Poll | null> {
  return prisma.poll.findFirst({
    where: {
      messageId,
      type: PollType.MONTAG,
      endedAt: null,
    },
  });
}

export async function findeLetztenMontagPoll(
  guildId: string,
  excludeMessageId?: string,
): Promise<Poll | null> {
  return prisma.poll.findFirst({
    where: {
      guildId,
      type: PollType.MONTAG,
      messageId: excludeMessageId ? { not: excludeMessageId } : undefined,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Legt einen neuen Montags-Poll in der DB an.
 */
export async function legeMontagPollAn(params: {
  guildId: string;
  channelId: string;
  messageId: string;
  question: string;
}): Promise<Poll> {
  const { guildId, channelId, messageId, question } = params;

  return prisma.poll.create({
    data: {
      guildId,
      channelId,
      messageId,
      question,
      type: PollType.MONTAG,
      startedAt: new Date(),
    },
  });
}

/**
 * Markiert einen Montags-Poll als beendet (endedAt gesetzt).
 * Gewinner wird separat über setMontagWinner() gesetzt.
 */
export async function beendeMontagPoll(pollId: string): Promise<Poll> {
  return prisma.poll.update({
    where: { id: pollId },
    data: {
      endedAt: new Date(),
    },
  });
}

/**
 * Setzt das Gewinner-Spiel für einen Montags-Poll.
 *
 * - Sucht das Spiel per name (exakte Übereinstimmung)
 * - Schreibt winnerGameId in Poll
 * - Aktualisiert lastPlayedAt beim Spiel
 *
 * Gibt Poll + (optional) das gefundene PollGame zurück.
 */
export async function setMontagWinner(params: {
  pollId: string;
  winnerGameName: string;
}): Promise<{ poll: Poll; game: PollGame | null }> {
  const { pollId, winnerGameName } = params;

  const normalizeName = (value: string): string =>
    value.replace(/\s+/g, ' ').trim();

  const normalized = normalizeName(winnerGameName);
  let game: PollGame | null = null;

  if (normalized.length > 0) {
    game =
      (await prisma.pollGame.findFirst({
        where: {
          name: {
            equals: normalized,
            mode: 'insensitive',
          },
        },
      })) ??
      (await prisma.pollGame.findFirst({
        where: {
          name: {
            equals: winnerGameName.trim(),
            mode: 'insensitive',
          },
        },
      }));
  }

  if (!game) {
    // Kein Game gefunden → winnerGameId bleibt leer, Poll wird nur upgedatet
    const poll = await prisma.poll.update({
      where: { id: pollId },
      data: {
        winnerGameId: null,
      },
    });

    return { poll, game: null };
  }

  // Poll + Spiel in einer Transaktion aktualisieren
  const [poll] = await prisma.$transaction([
    prisma.poll.update({
      where: { id: pollId },
      data: {
        winnerGameId: game.id,
      },
    }),
    prisma.pollGame.update({
      where: { id: game.id },
      data: {
        lastPlayedAt: new Date(),
        winCount: { increment: 1 },
      },
    }),
  ]);

  return { poll, game };
}

/**
 * Backfill für winCount aller PollGames basierend auf vorhandenen Montags-Polls.
 * Setzt zunächst alle winCounts auf 0 und zählt dann Gewinne pro Spiel neu hoch.
 */
export async function backfillMontagWinCounts(): Promise<void> {
  await prisma.pollGame.updateMany({
    data: { winCount: 0 },
  });

  const grouped = await prisma.poll.groupBy({
    by: ['winnerGameId'],
    where: {
      type: PollType.MONTAG,
      winnerGameId: { not: null },
    },
    _count: { _all: true },
  });

  for (const entry of grouped) {
    if (!entry.winnerGameId) continue;
    const wins = entry._count?._all ?? 0;
    if (wins === 0) continue;
    await prisma.pollGame.update({
      where: { id: entry.winnerGameId },
      data: { winCount: wins },
    });
  }
}
