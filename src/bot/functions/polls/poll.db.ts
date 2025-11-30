// FILE: src/bot/functions/polls/poll.db.ts

import type { Poll } from '@prisma/client';
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
      type: PollType.MONTAG,
      question,
      messageId,
      channelId,
      startedAt: new Date(),
    },
  });
}

/**
 * Markiert einen Montags-Poll als beendet.
 */
export async function beendeMontagPoll(pollId: string): Promise<void> {
  await prisma.poll.update({
    where: { id: pollId },
    data: {
      endedAt: new Date(),
    },
  });
}
