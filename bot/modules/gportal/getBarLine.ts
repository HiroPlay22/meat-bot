// bot/modules/gportal/getBarLine.ts

/**
 * Erstellt eine Zeile im diff-Markdown-Stil mit Balken und Wert.
 * Discord zeigt `+` = grün, `-` = rot, `!` = gelb in Codeblocks an.
 */
export function getBarLine(label: string, percent: number, valueLabel: string): string {
  const bar = getFalloutBar(percent);
  const paddedLabel = label.padEnd(14, ' ');
  const paddedValue = valueLabel.padStart(8, ' ');
  return `+ ${paddedLabel}${bar} ${paddedValue}`;
}

/**
 * Gibt nur den Balken zurück (für z. B. Zwei-Spalten-Darstellung).
 */
export function getBarLineOnlyBar(percent: number): string {
  return getFalloutBar(percent);
}

/**
 * Fallout-Stil-Balken mit fein abgestuften Unicode-Blöcken.
 */
function getFalloutBar(percent: number): string {
  const blocks = ['░', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];
  const max = 10;
  const value = Math.round((percent / 100) * max * 8);
  const full = Math.floor(value / 8);
  const partial = value % 8;

  const filled = '█'.repeat(full);
  const partialChar = partial ? blocks[partial] : '';
  const empty = '░'.repeat(max - full - (partial ? 1 : 0));

  return `${filled}${partialChar}${empty}`;
}
