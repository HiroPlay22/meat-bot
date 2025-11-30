// FILE: src/bot/general/config/server-settings-loader.ts

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  AlleServerSettings,
  ServerSettings,
  WelcomeFunktionsEinstellungen,
  LoggingSettings,
} from './server-settings-schema.js';

let cache: AlleServerSettings | null = null;

// Pfad relativ zum Projekt-Root (process.cwd())
// → funktioniert lokal (src) und auf dem Server (dist), solange src mitdeployt wird.
const SERVER_SETTINGS_RELATIVE_PATH = join(
  'src',
  'bot',
  'general',
  'config',
  'serverSettings.json',
);

async function ladeRohServerSettings(): Promise<AlleServerSettings> {
  if (cache) return cache;

  const projektRoot = process.cwd();
  const dateiPfad = join(projektRoot, SERVER_SETTINGS_RELATIVE_PATH);

  const inhalt = await readFile(dateiPfad, 'utf-8');
  const json = JSON.parse(inhalt) as AlleServerSettings;

  cache = json;
  return json;
}

function baueWelcomeDefaults(): WelcomeFunktionsEinstellungen {
  return {
    aktiv: false,
    loggingAktiv: true,
    logLevel: 'info',
    logChannelId: null,
    statsAktiv: false,
    ephemeralStandard: false,
    spezifisch: {
      welcomeChannelId: undefined,
      begruesseBots: true,
    },
  };
}

// 🔹 NEU: Globales Logging-Default pro Server
function baueLoggingDefaults(): LoggingSettings {
  return {
    aktiv: false,
    logLevel: 'info',
    logChannelId: null,
  };
}

function baueServerDefaults(): ServerSettings {
  return {
    sprache: 'de',
    datenschutz: {
      userTrackingErlaubt: false,
    },
    logging: baueLoggingDefaults(),
    functions: {
      welcome: baueWelcomeDefaults(),
    },
  };
}

/**
 * Lädt die ServerSettings für eine Guild.
 * Wenn keine Einträge vorhanden sind, wird ein Default-Objekt zurückgegeben.
 */
export async function ladeServerEinstellungen(
  guildId: string,
): Promise<ServerSettings> {
  const alleSettings = await ladeRohServerSettings();

  const settings = alleSettings[guildId];
  const defaults = baueServerDefaults();

  if (!settings) {
    // Noch nichts konfiguriert → Default, später kann man das vom Dashboard aus speichern.
    return defaults;
  }

  return {
    ...defaults,
    ...settings,
    logging: {
      ...defaults.logging,
      ...(settings as Partial<ServerSettings>).logging,
    },
    functions: {
      ...defaults.functions,
      ...settings.functions,
      welcome: {
        ...defaults.functions.welcome!,
        ...settings.functions.welcome,
      },
    },
  };
}
