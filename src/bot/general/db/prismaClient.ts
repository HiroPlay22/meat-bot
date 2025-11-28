// FILE: src/bot/general/db/prismaClient.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { logError } from '../logging/logger.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  logError('DATABASE_URL ist nicht gesetzt – Prisma kann nicht initialisiert werden.', {
    functionName: 'prismaClient',
  });
  throw new Error('Missing DATABASE_URL for Prisma');
}

declare global {
  // Verhindert mehrere Instanzen im Dev-Mode
  // eslint-disable-next-line no-var
  var __MEAT_PRISMA__: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  return new PrismaClient({
    adapter,
    // spätere Feinsteuerung möglich (query-Logging etc.)
    log: ['warn', 'error'],
  });
}

const prisma = global.__MEAT_PRISMA__ ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__MEAT_PRISMA__ = prisma;
}

export { prisma };
