
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

export const rateLimiter = {
  async limit(key: string) {
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || current.resetAt <= now) {
      const resetAt = now + WINDOW_MS;
      attempts.set(key, { count: 1, resetAt });
      return { success: true, limit: LIMIT, remaining: LIMIT - 1, reset: resetAt };
    }

    current.count += 1;

    if (current.count > LIMIT) {
      return { success: false, limit: LIMIT, remaining: 0, reset: current.resetAt };
    }

    return { success: true, limit: LIMIT, remaining: LIMIT - current.count, reset: current.resetAt };
  },
};
