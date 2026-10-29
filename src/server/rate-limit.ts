/** Limite simple en mémoire : nombre maximal de demandes IA par utilisateur sur une fenêtre glissante. */
export const AI_REQUEST_LIMIT = 20;
export const AI_WINDOW_MS = 10 * 60 * 1000;

const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  now = Date.now(),
): { allowed: boolean; retryAfterSec: number } {
  const recent = (hits.get(key) || []).filter((t) => now - t < AI_WINDOW_MS);
  if (recent.length >= AI_REQUEST_LIMIT) {
    hits.set(key, recent);
    return { allowed: false, retryAfterSec: Math.ceil((AI_WINDOW_MS - (now - recent[0]!)) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000)
    for (const [k, v] of hits) if (!v.some((t) => now - t < AI_WINDOW_MS)) hits.delete(k);
  return { allowed: true, retryAfterSec: 0 };
}

export function resetRateLimit() {
  hits.clear();
}
