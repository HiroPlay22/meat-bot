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

export interface ServerSettings {
  sprache: 'de' | 'en';
  datenschutz: DatenschutzSettings;
  functions: FunktionenSettings;
}

export type AlleServerSettings = Record<string, ServerSettings>;
