type RollType = 'd6' | 'd4' | 'd8' | 'd10' | 'd12' | 'd20';

interface RollState {
  type: RollType;
  count: number;
  modifier?: number;
  gmEnabled?: boolean;
  lastRollAt?: number;
}

const rollSession = new Map<string, RollState>(); // key = userId
const activeRolls = new Set<string>(); // Sperre gegen gleichzeitige Würfe

// Standard-Session
export function setRollState(userId: string, state: RollState) {
  rollSession.set(userId, state);
}

export function getRollState(userId: string): RollState | undefined {
  return rollSession.get(userId);
}

export function clearRollState(userId: string) {
  rollSession.delete(userId);
}

// 🛡️ Anti-Doppelwurf-Mechanik
export function isRolling(userId: string) {
  return activeRolls.has(userId);
}

export function startRolling(userId: string) {
  activeRolls.add(userId);
}

export function stopRolling(userId: string) {
  activeRolls.delete(userId);
}
