// FILE: src/bot/general/texts/text-loader.ts

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { logError } from '../logging/logger.js';

const dateiName = fileURLToPath(import.meta.url);
const ordnerName = dirname(dateiName);

// Sprachen, die aktuell unterstützt werden
export type VerfügbareSprache = 'de';

export function ladeTexte(
  funktionPfad: string,
  sprache: VerfügbareSprache = 'de',
): any {
  try {
    // Pfad: src/bot/functions/<funktionPfad>/texte.<sprache>.json
    const pfadZurTextdatei = join(
      ordnerName,
      '..', // general
      '..', // bot
      'functions',
      funktionPfad,
      `texte.${sprache}.json`,
    );

    const inhalt = readFileSync(pfadZurTextdatei, 'utf8');
    return JSON.parse(inhalt);
  } catch (error) {
    logError('Fehler beim Laden der Text-JSON', {
      functionName: 'ladeTexte',
      extra: { funktionPfad, sprache, error },
    });
    return {};
  }
}
