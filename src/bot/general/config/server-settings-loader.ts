// FILE: src/bot/general/config/server-settings-loader.ts

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  AlleServerSettings,
  FunktionenSettings,
  LoggingSettings,
  PollMontagFunktionsEinstellungen,
  ServerSettings,
  WelcomeFunktionsEinstellungen,
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
    ephemeralStandard: false,
    spezifisch: {
      allowedRoleIds: [],
      announcementChannelId: null,
    },
  };
}

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
      polls: {
        montag: bauePollMontagDefaults(),
      },
    },
  };
}

/**
 * Lädt die ServerSettings für eine Guild und merged sie
 * mit sinnvollen Defaults.
 */
export async function ladeServerEinstellungen(
  guildId: string,
): Promise<ServerSettings> {
  const alleSettings = await ladeRohServerSettings();
  const settings = alleSettings[guildId];

  const defaults = baueServerDefaults();

  // Noch nichts konfiguriert → reine Defaults
  if (!settings) {
    return defaults;
  }

  const mergedFunctions: FunktionenSettings = {
    ...defaults.functions,
    ...settings.functions,
    welcome: {
      ...defaults.functions.welcome!,
      ...settings.functions?.welcome,
      spezifisch: {
        ...defaults.functions.welcome?.spezifisch,
        ...settings.functions?.welcome?.spezifisch,
      },
    },
    polls: {
      ...defaults.functions.polls,
      ...settings.functions?.polls,
      montag: {
        ...defaults.functions.polls?.montag!,
        ...settings.functions?.polls?.montag,
        spezifisch: {
          ...defaults.functions.polls?.montag?.spezifisch,
          ...settings.functions?.polls?.montag?.spezifisch,
        },
      },
    },
  };

  const mergedLogging: LoggingSettings = {
    ...defaults.logging,
    ...(settings.logging ?? {}),
  };

  return {
    ...defaults,
    ...settings,
    logging: mergedLogging,
    functions: mergedFunctions,
  };
}
