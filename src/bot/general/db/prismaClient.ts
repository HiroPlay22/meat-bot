// FILE: src/bot/general/db/prismaClient.ts

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as prismaPkg from '@prisma/client';
import { logError } from '../logging/logger.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL ist nicht gesetzt. Prisma kann keine Verbindung aufbauen.',
  );
}

// PostgreSQL Connection Pool
const pool = new Pool({ connectionString });

// Prisma 7 Adapter für PostgreSQL
const adapter = new PrismaPg(pool);

// PrismaClient aus dem Paket holen (Prisma 7 → kein typisierter Named Export)
const { PrismaClient } = prismaPkg as any;

// Gemeinsamer Prisma-Client für den gesamten Bot
export const prisma = new PrismaClient({ adapter });

// Aufräumen bei lokalem Exit (in Railway eher theoretisch, aber schadet nicht)
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    try {
      await prisma.$disconnect();
      await pool.end();
    } catch (error) {
      logError('Fehler beim Herunterfahren der Prisma-/DB-Verbindung', {
        functionName: 'prismaClient.beforeExit',
        extra: { error },
      });
    }
  });
}
