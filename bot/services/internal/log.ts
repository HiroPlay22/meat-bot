/**
 * Zentrales Logging-Modul für M.E.A.T.
 * Erweitert mit systemLog für Startmeldungen & interne Abläufe
 */

import { Client, TextChannel } from 'discord.js';
import raw from '@config/serverSettings.json' with { type: 'json' };

const LOG_PREFIX = '[M.E.A.T.-LOG]';

/**
 * Allgemeines Event-Log – rein lokal in die Konsole
 */
export function logEvent(source: string, payload?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[LOG ${timestamp}] [${source}]`, payload ?? "");
}

/**
 * Systemlog für Start, Fehler, Initialisierung (Konsole + optional Discord als Text – ohne Ping)
 */
export async function logSystem(message: string, client?: Client) {
  // Terminal-Log
  const timestamp = new Date().toISOString();
  console.log(`🛰️ [SYSTEM ${timestamp}] ${message}`);

  // Optional: Discord-Textlog
  if (!client) return;

  const logChannelId = raw?.logChannelId;
  if (!logChannelId) return;

  const channel = client.channels.cache.get(logChannelId) as TextChannel;
  if (!channel?.send) return;

 await channel.send({
  content: `${LOG_PREFIX} ${message}`,
  allowedMentions: { parse: [] }
});

}
