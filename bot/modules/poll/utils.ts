import { prisma } from "@database/client.js";

export async function getPollNumber(type: string): Promise<number> {
  const count = await prisma.poll.count({ where: { type } });
  return count + 1; // Neue Nummer
}

export async function getLastWinner(type: string): Promise<string> {
  const last = await prisma.poll.findFirst({
    where: { type, winnerId: { not: null } },
    orderBy: { endedAt: 'desc' },
    include: { winner: true },
  });

  return last?.winner?.name ?? '–';
}
