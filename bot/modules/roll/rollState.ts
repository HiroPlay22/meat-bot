// bot/modules/roll/rollState.ts

type RollType = 'd6' | 'd4' | 'd8' | 'd10' | 'd12' | 'd20';
type RollPhase = 'phase1' | 'phase2' | 'phase3' | 'phase_dnd_select' | 'phase_dnd_count';

interface RollState {
  type?: RollType;
  count?: number;
  modifier?: number;
  gmEnabled?: boolean;
  phaseHistory?: RollPhase[];
  ownerId?: string;
}

const rollSession = new Map<string, RollState>(); // key = userId
const activeRolls = new Set<string>(); // Schutz gegen Doppeleingaben

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

// === PHASE HISTORY ===
export function pushPhase(userId: string, phase: RollPhase) {
  const state = getRollState(userId);
  if (!state) return;
  if (!state.phaseHistory) state.phaseHistory = [];
  state.phaseHistory.push(phase);
}

export function popLastPhase(userId: string): RollPhase | undefined {
  const state = getRollState(userId);
  if (!state?.phaseHistory || state.phaseHistory.length === 0) return undefined;
  return state.phaseHistory.pop();
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
