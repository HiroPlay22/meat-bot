// 📄 modules/live/liveCooldown.ts

const cooldownMap = new Map<string, number>();

export function hasCooldown(key: string): boolean {
  const expiresAt = cooldownMap.get(key);
  if (!expiresAt) return false;

  const now = Date.now();
  return now < expiresAt;
}

export function setCooldown(key: string, durationMs: number): void {
  const expiresAt = Date.now() + durationMs;
  cooldownMap.set(key, expiresAt);
}
