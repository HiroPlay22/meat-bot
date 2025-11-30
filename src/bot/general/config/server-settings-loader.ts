// FILE: src/bot/general/config/server-settings-loader.ts

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  AlleServerSettings,
  ServerSettings,
  WelcomeFunktionsEinstellungen,
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

function baueServerDefaults(): ServerSettings {
  return {
    sprache: 'de',
    datenschutz: {
      userTrackingErlaubt: false,
    },
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

  if (!settings) {
    // Noch nichts konfiguriert → Default, später kann man das vom Dashboard aus speichern.
    return baueServerDefaults();
  }

  const defaults = baueServerDefaults();

  return {
    ...defaults,
    ...settings,
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
