// FILE: src/bot/functions/stats/polls/montag/montag.stats.ts

import { prisma } from '../../../../general/db/prismaClient.js';

export type MontagGameStat = {
  id: string;
  name: string;
  winCount: number;
  isFree: boolean;
  maxPlayers: number | null;
};

export type MontagStats = {
  gameCount: number;
  topWins: MontagGameStat[];
  newest: MontagGameStat[];
};

export async function ladeMontagStats(_guildId: string): Promise<MontagStats> {
  // Aktuell globale Games; winCount nicht pro Guild
  const gameCount = await prisma.pollGame.count({
    where: { isActive: true },
  });

  const topWinsRaw = await prisma.pollGame.findMany({
    where: { isActive: true },
    orderBy: { winCount: 'desc' },
    take: 5,
  });

  const newestRaw = await prisma.pollGame.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const mapStat = (g: any): MontagGameStat => ({
    id: g.id,
    name: g.name,
    winCount: g.winCount ?? 0,
    isFree: !!g.isFree,
    maxPlayers: g.maxPlayers ?? null,
  });

  return {
    gameCount,
    topWins: topWinsRaw.map(mapStat),
    newest: newestRaw.map(mapStat),
  };
}

