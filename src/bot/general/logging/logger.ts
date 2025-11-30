// FILE: src/bot/general/logging/logger.ts

import type { Client, TextChannel } from 'discord.js';
import { ladeServerEinstellungen } from '../config/server-settings-loader.js';
import type { LogLevel as SettingsLogLevel } from '../config/server-settings-schema.js';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  guildId?: string;
  channelId?: string;
  userId?: string;
  commandName?: string;
  functionName?: string;
  extra?: Record<string, unknown>;
  // Platz für spätere Zusatzinfos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface LogOptions {
  level: LogLevel;
  message: string;
  context?: LogContext;
}

// Discord-Client-Referenz für Log-Channel-Ausgabe
let discordClient: Client | null = null;

// von außen (index.ts) einmal setzen
export function setDiscordClient(client: Client): void {
  discordClient = client;
}

// Mapping von Settings-LogLevel (serverSettings) – lowercase
const SETTINGS_LOG_LEVEL_ORDER: SettingsLogLevel[] = [
  'debug',
  'info',
  'warn',
  'error',
];

function mapLoggerToSettingsLevel(level: LogLevel): SettingsLogLevel {
  switch (level) {
    case 'DEBUG':
      return 'debug';
    case 'INFO':
      return 'info';
    case 'WARN':
      return 'warn';
    case 'ERROR':
    default:
      return 'error';
  }
}

function levelErlaubt(
  aktuellerLevel: LogLevel,
  minimalLevel: SettingsLogLevel,
): boolean {
  const mapped = mapLoggerToSettingsLevel(aktuellerLevel);
  const idxAktuell = SETTINGS_LOG_LEVEL_ORDER.indexOf(mapped);
  const idxMinimal = SETTINGS_LOG_LEVEL_ORDER.indexOf(minimalLevel);

  if (idxAktuell === -1 || idxMinimal === -1) return true;
  return idxAktuell >= idxMinimal;
}

function baueContextString(context?: LogContext): string {
  if (!context) return '';

  const ctxParts: string[] = [];

  if (context.guildId) ctxParts.push(`guild=${context.guildId}`);
  if (context.channelId) ctxParts.push(`channel=${context.channelId}`);
  if (context.userId) ctxParts.push(`user=${context.userId}`);
  if (context.commandName) ctxParts.push(`cmd=${context.commandName}`);
  if (context.functionName) ctxParts.push(`fn=${context.functionName}`);

  if (context.extra && Object.keys(context.extra).length > 0) {
    try {
      ctxParts.push(`extra=${JSON.stringify(context.extra)}`);
    } catch {
      ctxParts.push('extra=[Unserialisierbar]');
    }
  }

  return ctxParts.length > 0 ? ` | ${ctxParts.join(' | ')}` : '';
}

/**
 * Zentraler Logger – schreibt in die Konsole
 * und (falls konfiguriert) auch in den Discord-Log-Channel.
 */
export function log({ level, message, context }: LogOptions): void {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] ${message}`;
  const ctxString = baueContextString(context);
  const finalLine = `${base}${ctxString}`;

  // 1) Konsole (wie bisher)
  // eslint-disable-next-line no-console
  console.log(finalLine);

  // 2) Discord-Logchannel (asynchron, aber Fehler werden verschluckt)
  void sendeLogInDiscord(level, finalLine, context);
}

// --------- Discord-Logging ----------

async function sendeLogInDiscord(
  level: LogLevel,
  line: string,
  context?: LogContext,
): Promise<void> {
  if (!discordClient) return;

  // Falls eine Guild explizit angegeben ist → genau diese nehmen
  if (context?.guildId) {
    await sendeInGuildLogChannel(context.guildId, level, line);
    return;
  }

  // Sonst: an alle Guilds senden, die Logging aktiviert haben
  const guilds = discordClient.guilds.cache;
  if (guilds.size === 0) return;

  const promises: Promise<void>[] = [];
  for (const [guildId] of guilds) {
    promises.push(sendeInGuildLogChannel(guildId, level, line));
  }

  await Promise.allSettled(promises);
}

async function sendeInGuildLogChannel(
  guildId: string,
  level: LogLevel,
  line: string,
): Promise<void> {
  try {
    const settings = await ladeServerEinstellungen(guildId);
    const logging = settings.logging;

    if (!logging.aktiv || !logging.logChannelId) return;
    if (!levelErlaubt(level, logging.logLevel)) return;
    if (!discordClient) return;

    const channel = await discordClient.channels.fetch(logging.logChannelId);
    if (!channel || !channel.isTextBased()) return;

    const textChannel = channel as TextChannel;

    // Wir nutzen die bestehende Log-Line 1:1 als Codeblock – später kann das Embed-Style werden
    await textChannel.send({
      content: `\`\`\`\n${line}\n\`\`\``,
    });
  } catch {
    // Fehler im Logging niemals weiterwerfen – wir wollen keine Endlosschleifen
  }
}

// Komfort-Helper, damit wir im Code nicht ständig level setzen müssen:

export function logInfo(message: string, context?: LogContext): void {
  log({ level: 'INFO', message, context });
}

export function logWarn(message: string, context?: LogContext): void {
  log({ level: 'WARN', message, context });
}

export function logError(message: string, context?: LogContext): void {
  log({ level: 'ERROR', message, context });
}

export function logDebug(message: string, context?: LogContext): void {
  log({ level: 'DEBUG', message, context });
}
