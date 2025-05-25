import { Client, TextChannel } from 'discord.js';
import raw from '@config/serverSettings.json' with { type: 'json' };

const LOG_PREFIX = '[M.E.A.T.-LOG]';

/**
 * Protokolliert ein Ereignis in der Konsole und – sofern möglich – als Textzeile im Logchannel auf Discord.
 */
export async function logSystem(message: string, client?: Client, context = 'System') {
  const timestamp = new Date().toISOString();
  const formatted = `${LOG_PREFIX} [${context}] ${message}`;

  // Terminal-Log
  console.log(`🛰️ [SYSTEM ${timestamp}] ${message}`);

  // Optional: Discord-Textlog
  if (!client) return;

  const logChannelId = raw?.logChannelId;
  if (!logChannelId) return;

  const channel = client.channels.cache.get(logChannelId) as TextChannel;
  if (!channel?.send) return;

  await channel.send(formatted);
}
