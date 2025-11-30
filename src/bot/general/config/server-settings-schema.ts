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

// 🔹 Welcome

export interface WelcomeSpezifischSettings {
  welcomeChannelId?: string;
  begruesseBots?: boolean;
}

export interface WelcomeFunktionsEinstellungen
  extends FunktionsBasisEinstellungen {
  spezifisch?: WelcomeSpezifischSettings;
}

// 🔹 Polls – Montags-Runde

export interface PollMontagSpezifischSettings {
  allowedRoleIds?: string[];
  announcementChannelId?: string | null;
}

export interface PollMontagFunktionsEinstellungen
  extends FunktionsBasisEinstellungen {
  spezifisch?: PollMontagSpezifischSettings;
}

export interface PollsFunktionsSettings {
  montag?: PollMontagFunktionsEinstellungen;
}

// 🔹 Funktionen-Sammler

export interface FunktionenSettings {
  welcome?: WelcomeFunktionsEinstellungen;
  polls?: PollsFunktionsSettings;
}

// 🔹 Datenschutz

export interface DatenschutzSettings {
  userTrackingErlaubt: boolean;
}

// 🔹 Globales Logging pro Server

export interface LoggingSettings {
  aktiv: boolean;
  logLevel: LogLevel;
  logChannelId: string | null;
}

// 🔹 Hauptobjekt pro Guild

export interface ServerSettings {
  sprache: 'de' | 'en';
  datenschutz: DatenschutzSettings;
  logging: LoggingSettings; // ⬅️ nicht mehr optional
  functions: FunktionenSettings;
}

export type AlleServerSettings = Record<string, ServerSettings>;
