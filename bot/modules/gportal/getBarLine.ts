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
