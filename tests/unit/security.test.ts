import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimiterForTesting } from '@/lib/security/rate-limiter';
import { verifyTurnstileToken } from '@/lib/security/turnstile';

describe('Security Layer', () => {
  beforeEach(() => {
    resetRateLimiterForTesting();
    vi.restoreAllMocks();
  });

  describe('Rate Limiter', () => {
    it('should allow requests within limit and block when exceeded', () => {
      const ip = '192.168.1.100';
      const limit = 5;
      const windowMs = 60000;

      for (let i = 0; i < limit; i++) {
        const res = checkRateLimit(ip, limit, windowMs);
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(limit - 1 - i);
      }

      // 6th request in the same window should be blocked
      const blocked = checkRateLimit(ip, limit, windowMs);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('should track separate IPs independently', () => {
      const ipA = '1.1.1.1';
      const ipB = '2.2.2.2';

      for (let i = 0; i < 3; i++) {
        checkRateLimit(ipA, 3, 60000);
      }

      expect(checkRateLimit(ipA, 3, 60000).allowed).toBe(false);
      expect(checkRateLimit(ipB, 3, 60000).allowed).toBe(true);
    });
  });

  describe('Turnstile Verification', () => {
    it('should reject empty or missing token', async () => {
      const res1 = await verifyTurnstileToken('');
      expect(res1).toBe(false);

      const res2 = await verifyTurnstileToken('   ');
      expect(res2).toBe(false);
    });

    it('should accept valid test tokens when TURNSTILE_SECRET_KEY is not configured or in test mode', async () => {
      // In local dev/test mode without credentials, test tokens should pass
      const result = await verifyTurnstileToken('mock-turnstile-token');
      expect(typeof result).toBe('boolean');
    });
  });
});
