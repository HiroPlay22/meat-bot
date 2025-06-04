// modules/live/liveLocks.ts

const lockMap = new Map<string, boolean>();

export function withLiveLock<T>(key: string, fn: () => Promise<T>): Promise<T | null> {
  if (lockMap.has(key)) return Promise.resolve(null);

  lockMap.set(key, true);
  return fn()
    .catch((err) => {
      throw err;
    })
    .finally(() => {
      lockMap.delete(key);
    });
}
