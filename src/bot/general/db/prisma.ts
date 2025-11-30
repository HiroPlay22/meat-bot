// FILE: src/bot/general/db/prisma.ts

// Thin wrapper, damit alte Imports wie `../db/prisma.js` weiterhin funktionieren.
// Der eigentliche PrismaClient wird in `prismaClient.ts` gebaut.

export { prisma } from './prismaClient.js';
