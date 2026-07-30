
import { NextRequest } from 'next/server';

const LIMIT = 10;
const WINDOW_MS = 10_000;
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

const loginDelays = new Map<string, number>();
const DELAY_DURATION = 2000; // 2 seconds

export const applyLoginDelay = (ip: string): Promise<void> => {
  const lastAttempt = loginDelays.get(ip);
  const now = Date.now();

  if (lastAttempt) {
    const timeSince = now - lastAttempt;
    if (timeSince < DELAY_DURATION) {
      const delay = DELAY_DURATION - timeSince;
      return new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  loginDelays.set(ip, now);
  return Promise.resolve();
};

export const getIp = (req: NextRequest): string => {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (!forwardedFor) {
    return '127.0.0.1';
  }

  return forwardedFor.split(',')[0]?.trim() || '127.0.0.1';
};
