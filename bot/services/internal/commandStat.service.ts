import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function incrementUsage(command: string): Promise<number> {
  const result = await prisma.commandStat.upsert({
    where: { command },
    update: { count: { increment: 1 } },
    create: { command, count: 1 }
  });
  return result.count;
}

export async function getUsage(command: string): Promise<number> {
  const stat = await prisma.commandStat.findUnique({
    where: { command }
  });
  return stat?.count ?? 0;
}