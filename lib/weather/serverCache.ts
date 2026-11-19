// Simple in-memory TTL cache, shared by every request to this server process.
// This is intentionally not a database: the goal is just to let many nearby
// farms share one upstream Open-Meteo call within Open-Meteo's fair-use terms.
// In a multi-instance deployment this cache is per-instance, which is fine —
// it only needs to reduce duplicate calls, not eliminate them. If the app is
// ever deployed across many instances behind a load balancer, swap this for
// Vercel Runtime Cache / Global Config without changing the caller's API.

interface CacheRow<T> {
  data: T;
  storedAt: number;
}

const store = new Map<string, CacheRow<unknown>>();

export function serverCacheGet<T>(key: string, maxAgeMs: number): T | null {
  const row = store.get(key);
  if (!row) return null;
  if (Date.now() - row.storedAt > maxAgeMs) return null;
  return row.data as T;
}

export function serverCacheGetStale<T>(key: string): { data: T; storedAt: number } | null {
  const row = store.get(key);
  if (!row) return null;
  return { data: row.data as T, storedAt: row.storedAt };
}

export function serverCacheSet<T>(key: string, data: T): void {
  store.set(key, { data, storedAt: Date.now() });
}
