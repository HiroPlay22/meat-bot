// FILE: src/bot/general/logging/logger.ts

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  guildId?: string;
  channelId?: string;
  userId?: string;
  commandName?: string;
  functionName?: string;
  extra?: Record<string, unknown>;
}

interface LogOptions {
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Zentraler Logger – aktuell nur Konsole.
 * Später können wir hier:
 * - in Dateien loggen
 * - in einen Discord-Log-Channel posten
 * - Stats/Monitoring triggern
 */
export function log({ level, message, context }: LogOptions): void {
  const timestamp = new Date().toISOString();

  const base = `[${timestamp}] [${level}] ${message}`;

  if (!context) {
    console.log(base);
    return;
  }

  const ctxParts: string[] = [];

  if (context.guildId) ctxParts.push(`guild=${context.guildId}`);
  if (context.channelId) ctxParts.push(`channel=${context.channelId}`);
  if (context.userId) ctxParts.push(`user=${context.userId}`);
  if (context.commandName) ctxParts.push(`cmd=${context.commandName}`);
  if (context.functionName) ctxParts.push(`fn=${context.functionName}`);

  if (context.extra && Object.keys(context.extra).length > 0) {
    ctxParts.push(`extra=${JSON.stringify(context.extra)}`);
  }

  const ctxString = ctxParts.length > 0 ? ` | ${ctxParts.join(' | ')}` : '';

  console.log(`${base}${ctxString}`);
}

// Komfort-Helper, damit wir später im Code nicht ständig level setzen müssen:

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
