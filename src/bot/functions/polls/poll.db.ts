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

  const trimmed = winnerGameName.trim();
  let game: PollGame | null = null;

  if (trimmed.length > 0) {
    game = await prisma.pollGame.findFirst({
      where: {
        name: trimmed,
      },
    });
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
      },
    }),
  ]);

  return { poll, game };
}
