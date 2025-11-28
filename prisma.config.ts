// FILE: prisma.config.ts

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Pfad zu deiner schema.prisma
  schema: 'prisma/schema.prisma',

  // Wo Migrationen landen sollen
  migrations: {
    path: 'prisma/migrations',
  },

  // Hier steht jetzt die DB-URL (statt in schema.prisma)
  datasource: {
    url: env('DATABASE_URL'),
  },
});
