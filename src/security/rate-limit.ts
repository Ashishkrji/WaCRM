/**
 * Rate limiting utility.
 * In a production SaaS environment, this should be backed by Redis.
 * For now, this is a basic in-memory implementation to fulfill the security requirement.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function checkRateLimit(
  identifier: string,
  limit: number = 100, // max requests
  windowMs: number = 60000 // 1 minute
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = store[identifier];

  if (!record || record.resetTime < now) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { success: true, limit, remaining: limit - 1, reset: store[identifier].resetTime };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { success: true, limit, remaining: limit - record.count, reset: record.resetTime };
}
