// bot/modules/roll/rollUtils.ts

export function rollDice(type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20', count: number): number[] {
  const sides = parseInt(type.replace('d', ''));
  return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
}

export function getDiceEmoji(count: number): string {
  return '🎲'.repeat(Math.min(count, 5));
}

export function getRollQuality(total: number, max: number): 'very bad' | 'bad' | 'average' | 'good' | 'very good' | 'perfect' {
  const percentage = total / max;
  if (total === max) return 'perfect';
  if (percentage >= 0.8) return 'very good';
  if (percentage >= 0.6) return 'good';
  if (percentage >= 0.4) return 'average';
  if (percentage >= 0.2) return 'bad';
  return 'very bad';
}

export function getComment(quality: ReturnType<typeof getRollQuality>): string {
  switch (quality) {
    case 'very bad':
      return 'Das war ein kritischer Reinfall. 🫠';
    case 'bad':
      return 'Naja… M.E.A.T. hat schon Besseres gesehen.';
    case 'average':
      return 'Solide. Nicht glanzvoll, aber ehrlich.';
    case 'good':
      return 'Sauberer Wurf. Kann sich sehen lassen.';
    case 'very good':
      return 'M.E.A.T. verbeugt sich. Stark gespielt.';
    case 'perfect':
      return '💥 CRIT! Du hast die Wahrscheinlichkeiten verprügelt.';
  }
}
