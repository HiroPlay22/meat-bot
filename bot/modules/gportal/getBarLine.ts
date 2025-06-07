/**
 * Erstellt eine Zeile mit Label, Balken und rechtem Wert (z. B. „74 %“ oder „08 / 10“)
 */
export function getBarLine(label: string, percent: number, valueLabel: string): string {
  const blocks = ['░', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];
  const max = 10;
  const value = Math.round((percent / 100) * max * 8);
  const full = Math.floor(value / 8);
  const partial = value % 8;
  const bar = '█'.repeat(full) + (partial ? blocks[partial] : '') + '░'.repeat(max - full - (partial ? 1 : 0));

  const paddedLabel = label.padEnd(13, ' ');
  const paddedValue = valueLabel.padStart(8, ' ');
  return `${paddedLabel}${bar} ${paddedValue}`;
}

/**
 * Gibt nur den Balken zurück, z. B. für Zwei-Spalten-Darstellung
 */
export function getBarLineOnlyBar(percent: number): string {
  const blocks = ['░', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];
  const max = 10;
  const value = Math.round((percent / 100) * max * 8);
  const full = Math.floor(value / 8);
  const partial = value % 8;
  return '█'.repeat(full) + (partial ? blocks[partial] : '') + '░'.repeat(max - full - (partial ? 1 : 0));
}
