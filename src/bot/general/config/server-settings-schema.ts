// FILE: src/bot/general/config/server-settings-schema.ts

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface GlobalLoggingSettings {
  aktiv: boolean;
  logLevel: LogLevel;
  logChannelId: string | null;
}

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

// 🔹 Welcome-Funktion

export interface WelcomeSpezifischSettings {
  welcomeChannelId?: string;
  begruesseBots?: boolean;
}

export interface WelcomeFunktionsEinstellungen
  extends FunktionsBasisEinstellungen {
  spezifisch?: WelcomeSpezifischSettings;
}

// 🔹 Polls / Montags-Runde

export interface PollMontagSpezifischSettings {
  announcementChannelId?: string | null;
}

export interface PollMontagFunktionsEinstellungen
  extends FunktionsBasisEinstellungen {
  spezifisch?: PollMontagSpezifischSettings;
}

export interface PollsFunktionsEinstellungen {
  montag?: PollMontagFunktionsEinstellungen;
}

export interface FunktionenSettings {
  welcome?: WelcomeFunktionsEinstellungen;
  polls?: PollsFunktionsEinstellungen;
}

// 🔹 Datenschutz

export interface DatenschutzSettings {
  userTrackingErlaubt: boolean;
}

// 🔹 ServerSettings – GLOBAL

export interface ServerSettings {
  sprache: 'de' | 'en';
  datenschutz: DatenschutzSettings;
  logging?: GlobalLoggingSettings;      // 👈 wichtig für logger.ts
  functions: FunktionenSettings;
}

export type AlleServerSettings = Record<string, ServerSettings>;
