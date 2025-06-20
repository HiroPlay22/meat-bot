// bot/modules/roll/rollState.ts

type RollType = 'd6' | 'd4' | 'd8' | 'd10' | 'd12' | 'd20';
export type RollPhase = 'phase1' | 'phase2' | 'phase3' | 'phase_dnd_select' | 'phase_dnd_count';

export interface RollState {
  type?: RollType;
  count?: number;
  modifier?: number;
  gmEnabled?: boolean;
  ownerId?: string;
}

const rollSession = new Map<string, RollState>(); // key = userId
const activeRolls = new Set<string>(); // Sperre gegen gleichzeitiges Würfeln

// === SESSION MANAGEMENT ===
export function setRollState(userId: string, partial: Partial<RollState>) {
  const current = rollSession.get(userId) || {};
  const newOwnerId = current.ownerId ?? userId;
  rollSession.set(userId, { ...current, ...partial, ownerId: newOwnerId });
}

export function getRollState(userId: string): RollState | undefined {
  return rollSession.get(userId);
}

export function clearRollState(userId: string) {
  rollSession.delete(userId);
}

// === ROLLING LOCK ===
export function isRolling(userId: string) {
  return activeRolls.has(userId);
}

export function startRolling(userId: string) {
  activeRolls.add(userId);
}

export function stopRolling(userId: string) {
  activeRolls.delete(userId);
}

// === PHASE-NAVIGATION ===
export function getPreviousPhase(current: RollPhase, state: RollState): RollPhase {
  switch (current) {
    case 'phase3':
      return state.type === 'd6' ? 'phase2' : 'phase_dnd_select';
    case 'phase2':
      return 'phase1';
    case 'phase_dnd_select':
      return 'phase_dnd_count';
    case 'phase_dnd_count':
      return 'phase1';
    default:
      return 'phase1';
  }
}
