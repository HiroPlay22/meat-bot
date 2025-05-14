/**
 * Zentrales Logging-Modul für M.E.A.T.
 * Erweitert mit systemLog für Startmeldungen & interne Abläufe
 */

export function logEvent(source: string, payload?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[LOG ${timestamp}] [${source}]`, payload ?? "");
  }
  
  /**
   * Systemlog für Start, Fehler, Initialisierung
   */
  export function logSystem(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`🛰️ [SYSTEM ${timestamp}] ${message}`);
  }
  