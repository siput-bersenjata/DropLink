interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export function checkRateLimit(
  ip: string,
  limit = 10,
  windowMs = 60 * 60 * 1000 // 1 hour default
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(ip);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(ip, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetAt = new Date(oldest + windowMs);
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Record this hit
  record.timestamps.push(now);
  const remaining = limit - record.timestamps.length;
  const resetAt = new Date(now + windowMs);

  return {
    allowed: true,
    remaining,
    resetAt,
  };
}

export function resetRateLimiterForTesting(): void {
  rateLimitStore.clear();
}
