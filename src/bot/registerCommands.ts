// FILE: src/bot/registerCommands.ts

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { slashCommandList } from './commands/index.js';

const token = process.env.DISCORD_TOKEN;
const rawClientId = process.env.DISCORD_CLIENT_ID;
const rawGuildIds =
  process.env.DEV_GUILD_IDS ??
  (process.env.DEV_GUILD_ID ? `${process.env.DEV_GUILD_ID}` : undefined);

if (!token) {
  console.error('[M.E.A.T.] Env-Variable DISCORD_TOKEN fehlt. Bitte .env pruefen.');
  process.exit(1);
}

if (!rawClientId) {
  console.error('[M.E.A.T.] Env-Variable DISCORD_CLIENT_ID fehlt. Bitte .env pruefen.');
  process.exit(1);
}

if (!rawGuildIds) {
  console.error('[M.E.A.T.] Env-Variable DEV_GUILD_IDS oder DEV_GUILD_ID fehlt. Bitte .env pruefen.');
  process.exit(1);
}

const clientId: string = rawClientId;
const guildIds: string[] = rawGuildIds
  .split(',')
  .map((g) => g.trim())
  .filter((g) => g.length > 0);

if (!guildIds.length) {
  console.error('[M.E.A.T.] Keine gueltigen Guild-IDs gefunden. Bitte .env pruefen.');
  process.exit(1);
}

// Commands aus unserem zentralen Register holen
const commands = slashCommandList.map((command) => command.data.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

async function main() {
  try {
    console.log(`[M.E.A.T.] Registriere Slash-Commands fuer Guilds: ${guildIds.join(', ')} ...`);

    for (const guildId of guildIds) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log(`[M.E.A.T.] Slash-Commands registriert fuer Guild ${guildId}.`);
    }

    console.log('[M.E.A.T.] Slash-Commands erfolgreich registriert.');
  } catch (error) {
    console.error('[M.E.A.T.] Fehler beim Registrieren der Commands:', error);
  }
}

main();
