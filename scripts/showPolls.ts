// scripts/showPolls.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT id, type, createdAt FROM Poll
    WHERE type = 'fungames' AND endedAt IS NULL
  `;
  console.table(result);
}

main().finally(() => prisma.$disconnect());
