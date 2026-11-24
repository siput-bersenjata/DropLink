import { describe, it, expect } from 'vitest';
import { parseClientDeviceInfo } from '@/lib/audit/device-logger';

describe('Device Logger', () => {
  it('should parse IP, location headers, and User-Agent', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '103.20.10.5, 127.0.0.1');
    headers.set('x-vercel-ip-country', 'ID');
    headers.set('x-vercel-ip-city', 'Jakarta');
    headers.set(
      'user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    const result = parseClientDeviceInfo(headers, {
      screenResolution: '1920x1080',
      timezone: 'Asia/Jakarta',
    });

    expect(result.ipAddress).toBe('103.20.10.5');
    expect(result.country).toBe('ID');
    expect(result.city).toBe('Jakarta');
    expect(result.browserName).toContain('Chrome');
    expect(result.osName).toContain('Windows');
    expect(result.deviceType).toBe('desktop');
    expect(result.screenResolution).toBe('1920x1080');
    expect(result.timezone).toBe('Asia/Jakarta');
  });

  it('should handle mobile user agent and fallback IP headers', () => {
    const headers = new Headers();
    headers.set('x-real-ip', '182.253.50.12');
    headers.set(
      'user-agent',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
    );

    const result = parseClientDeviceInfo(headers);
    expect(result.ipAddress).toBe('182.253.50.12');
    expect(result.browserName).toContain('Mobile Safari');
    expect(result.osName).toBe('iOS');
    expect(result.deviceType).toBe('mobile');
  });

  it('should fallback gracefully when headers are missing', () => {
    const headers = new Headers();
    const result = parseClientDeviceInfo(headers);

    expect(result.ipAddress).toBe('127.0.0.1');
    expect(result.browserName).toBe('Unknown');
    expect(result.osName).toBe('Unknown');
    expect(result.deviceType).toBe('desktop');
  });
});
