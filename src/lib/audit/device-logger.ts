import { UAParser } from 'ua-parser-js';

export interface DeviceAuditRecord {
  ipAddress: string;
  country: string;
  city: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  screenResolution: string;
  timezone: string;
  createdAt: string;
}

export interface ClientDeviceHints {
  screenResolution?: string;
  timezone?: string;
}

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

export function parseClientDeviceInfo(
  headers: Headers,
  clientInfo?: ClientDeviceHints
): DeviceAuditRecord {
  const ipAddress = extractClientIp(headers);
  const country =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    'Unknown';
  const city = headers.get('x-vercel-ip-city') || 'Unknown';
  const userAgent = headers.get('user-agent') || '';

  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (device.type === 'tablet') {
    deviceType = 'tablet';
  }

  return {
    ipAddress,
    country,
    city,
    userAgent,
    browserName: browser.name || 'Unknown',
    browserVersion: browser.version || 'Unknown',
    osName: os.name || 'Unknown',
    osVersion: os.version || 'Unknown',
    deviceType,
    screenResolution: clientInfo?.screenResolution || 'Unknown',
    timezone: clientInfo?.timezone || 'UTC',
    createdAt: new Date().toISOString(),
  };
}
