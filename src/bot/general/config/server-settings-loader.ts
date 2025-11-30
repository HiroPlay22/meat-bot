// FILE: src/bot/general/config/server-settings-loader.ts

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  AlleServerSettings,
  ServerSettings,
  WelcomeFunktionsEinstellungen,
  PollMontagFunktionsEinstellungen,
  GlobalLoggingSettings,
} from './server-settings-schema.js';

let cache: AlleServerSettings | null = null;

// Pfad relativ zum Projekt-Root (process.cwd())
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

// 🔹 Defaults

function baueGlobalLoggingDefaults(): GlobalLoggingSettings {
  return {
    aktiv: false,
    logLevel: 'info',
    logChannelId: null,
  };
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

function bauePollMontagDefaults(): PollMontagFunktionsEinstellungen {
  return {
    aktiv: false,
    loggingAktiv: true,
    logLevel: 'info',
    logChannelId: null,
    statsAktiv: false,
    ephemeralStandard: true,
    spezifisch: {
      announcementChannelId: null,
    },
  };
}

function baueServerDefaults(): ServerSettings {
  return {
    sprache: 'de',
    datenschutz: {
      userTrackingErlaubt: false,
    },
    logging: baueGlobalLoggingDefaults(),
    functions: {
      welcome: baueWelcomeDefaults(),
      polls: {
        montag: bauePollMontagDefaults(),
      },
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
    return defaults;
  }

  return {
    ...defaults,
    ...settings,
    logging: {
      ...defaults.logging!,
      ...(settings.logging ?? {}),
    },
    functions: {
      ...defaults.functions,
      ...settings.functions,
      welcome: {
        ...defaults.functions.welcome!,
        ...settings.functions?.welcome,
      },
      polls: {
        ...defaults.functions.polls,
        ...settings.functions?.polls,
        montag: {
          ...defaults.functions.polls?.montag!,
          ...settings.functions?.polls?.montag,
        },
      },
    },
  };
}
