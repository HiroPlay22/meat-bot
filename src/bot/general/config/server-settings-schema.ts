// FILE: src/bot/general/config/server-settings-schema.ts

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface FunktionsBasisEinstellungen {
  aktiv: boolean;
  loggingAktiv: boolean;
  logLevel: LogLevel;
  logChannelId: string | null;
  statsAktiv: boolean;
  ephemeralStandard: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spezifisch?: Record<string, any>;
}

export interface WelcomeSpezifischSettings {
  welcomeChannelId?: string;
  begruesseBots?: boolean;
}

export interface WelcomeFunktionsEinstellungen
  extends FunktionsBasisEinstellungen {
  spezifisch?: WelcomeSpezifischSettings;
}

export interface FunktionenSettings {
  // weitere Funktionen später ergänzen
  welcome?: WelcomeFunktionsEinstellungen;
}

export interface DatenschutzSettings {
  userTrackingErlaubt: boolean;
}

// 🔹 NEU: Globales Logging pro Server (Ruleset-Style, aber schlank)
export interface LoggingSettings {
  aktiv: boolean;
  logLevel: LogLevel;
  logChannelId: string | null;
}

export interface ServerSettings {
  sprache: 'de' | 'en';
  datenschutz: DatenschutzSettings;
  logging: LoggingSettings;
  functions: FunktionenSettings;
}

export type AlleServerSettings = Record<string, ServerSettings>;
