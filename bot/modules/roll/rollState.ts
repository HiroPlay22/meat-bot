// modules/roll/rollState.ts

type RollType = 'd6' | 'd4' | 'd8' | 'd10' | 'd12' | 'd20';

interface RollState {
  type: RollType;
  count: number;
  modifier?: number;
  gmEnabled?: boolean;
}

const rollSession = new Map<string, RollState>(); // key = userId

export function setRollState(userId: string, state: RollState) {
  rollSession.set(userId, state);
}

export function getRollState(userId: string): RollState | undefined {
  return rollSession.get(userId);
}

export function clearRollState(userId: string) {
  rollSession.delete(userId);
}
