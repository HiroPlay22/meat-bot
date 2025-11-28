// FILE: src/bot/clearGlobalCommands.ts

import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const token = process.env.DISCORD_TOKEN;
const rawClientId = process.env.DISCORD_CLIENT_ID;

if (!token) {
  console.error('[M.E.A.T.] Env-Variable DISCORD_TOKEN fehlt. Bitte .env prüfen.');
  process.exit(1);
}

if (!rawClientId) {
  console.error('[M.E.A.T.] Env-Variable DISCORD_CLIENT_ID fehlt. Bitte .env prüfen.');
  process.exit(1);
}

const clientId: string = rawClientId;

const rest = new REST({ version: '10' }).setToken(token);

async function main() {
  try {
    console.log('[M.E.A.T.] Entferne alle GLOBALEN Slash-Commands ...');
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: [] } // leeres Array = alle globalen Commands löschen
    );
    console.log('[M.E.A.T.] Fertig. Alle globalen Commands wurden gelöscht.');
  } catch (error) {
    console.error('[M.E.A.T.] Fehler beim Löschen der globalen Commands:', error);
  }
}

main();
