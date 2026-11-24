import { describe, it, expect } from 'vitest';
import { detectBot } from '@/lib/security/bot-detector';

describe('Bot Detector', () => {
  it('should allow normal human browser request', () => {
    const result = detectBot({
      ip: '110.23.45.67',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timeTakenMs: 3000,
      honeypot: '',
    });

    expect(result.isBot).toBe(false);
  });

  it('should detect bot when honeypot trap is filled', () => {
    const result = detectBot({
      ip: '110.23.45.67',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      honeypot: 'http://spam-link.com',
    });

    expect(result.isBot).toBe(true);
    expect(result.reason).toContain('Honeypot');
  });

  it('should detect automated scrapers by user-agent', () => {
    const botUserAgents = [
      'curl/7.88.1',
      'python-requests/2.31.0',
      'PostmanRuntime/7.32.3',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/119.0.0.0',
      'Wget/1.21.3',
      'axios/1.6.2',
    ];

    for (const ua of botUserAgents) {
      const res = detectBot({
        ip: '110.23.45.67',
        userAgent: ua,
      });
      expect(res.isBot).toBe(true);
      expect(res.reason).toContain('Automated user-agent');
    }
  });

  it('should detect missing or empty user-agent', () => {
    const res = detectBot({
      ip: '110.23.45.67',
      userAgent: '',
    });

    expect(res.isBot).toBe(true);
    expect(res.reason).toContain('Missing or empty User-Agent');
  });

  it('should detect unnaturally fast bot submissions (< 400ms)', () => {
    const res = detectBot({
      ip: '110.23.45.67',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timeTakenMs: 150, // 150ms is too fast for a human
    });

    expect(res.isBot).toBe(true);
    expect(res.reason).toContain('Unnaturally fast');
  });
});
