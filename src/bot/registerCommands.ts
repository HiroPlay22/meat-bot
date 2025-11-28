// FILE: src/bot/registerCommands.ts

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { slashCommandList } from './commands/index.js';

const token = process.env.DISCORD_TOKEN;
const rawClientId = process.env.DISCORD_CLIENT_ID;
const rawDevGuildId = process.env.DEV_GUILD_ID;

if (!token) {
  console.error('[M.E.A.T.] Env-Variable DISCORD_TOKEN fehlt. Bitte .env prüfen.');
  process.exit(1);
}

if (!rawClientId) {
  console.error('[M.E.A.T.] Env-Variable DISCORD_CLIENT_ID fehlt. Bitte .env prüfen.');
  process.exit(1);
}

if (!rawDevGuildId) {
  console.error('[M.E.A.T.] Env-Variable DEV_GUILD_ID fehlt. Bitte .env prüfen.');
  process.exit(1);
}

const clientId: string = rawClientId;
const devGuildId: string = rawDevGuildId;

// Commands aus unserem zentralen Register holen
const commands = slashCommandList.map((command) => command.data.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

async function main() {
  try {
    console.log('[M.E.A.T.] Registriere Slash-Commands für DEV-Guild ...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, devGuildId),
      { body: commands }
    );
    console.log('[M.E.A.T.] Slash-Commands erfolgreich registriert.');
  } catch (error) {
    console.error('[M.E.A.T.] Fehler beim Registrieren der Commands:', error);
  }
}

main();
