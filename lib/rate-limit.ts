interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

function getOrCreate(key: string, windowMs: number, now: number): Entry {
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    const fresh = { count: 0, resetAt: now + windowMs };
    store.set(key, fresh);
    return fresh;
  }
  return entry;
}

/** Check AND increment — use for spam protection (count every request). */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = getOrCreate(key, windowMs, now);

  if (entry.count >= max) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

/** Only check, don't increment — use before credential verification. */
export function checkOnly(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) return { ok: true };

  if (entry.count >= max) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { ok: true };
}

/** Increment counter — call only on failure. */
export function recordFailure(key: string, windowMs: number): void {
  const now = Date.now();
  const entry = getOrCreate(key, windowMs, now);
  entry.count += 1;
}
