// FILE: src/bot/general/config/server-settings-loader.ts

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type {
  AlleServerSettings,
  ServerSettings,
  WelcomeFunktionsEinstellungen
} from './server-settings-schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cache: AlleServerSettings | null = null;

async function ladeRohServerSettings(): Promise<AlleServerSettings> {
  if (cache) return cache;

  const dateiPfad = join(__dirname, 'serverSettings.json');

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
      begruesseBots: true
    }
  };
}

function baueServerDefaults(): ServerSettings {
  return {
    sprache: 'de',
    datenschutz: {
      userTrackingErlaubt: false
    },
    functions: {
      welcome: baueWelcomeDefaults()
    }
  };
}

/**
 * Lädt die ServerSettings für eine Guild.
 * Wenn keine Einträge vorhanden sind, wird ein Default-Objekt zurückgegeben.
 */
export async function ladeServerEinstellungen(
  guildId: string
): Promise<ServerSettings> {
  const alleSettings = await ladeRohServerSettings();

  const settings = alleSettings[guildId];

  if (!settings) {
    // Noch nichts konfiguriert → Default, später kann man das vom Dashboard aus speichern.
    return baueServerDefaults();
  }

  // Fallbacks zusammenführen (falls Felder fehlen)
  const defaults = baueServerDefaults();

  return {
    ...defaults,
    ...settings,
    functions: {
      ...defaults.functions,
      ...settings.functions,
      welcome: {
        ...defaults.functions.welcome!,
        ...settings.functions.welcome
      }
    }
  };
}
