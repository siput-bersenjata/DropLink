/**
 * Multi-layer Invisible Bot & Abuse Detection
 * Runs completely on the backend without requiring visible captcha widgets
 */

export interface BotCheckInput {
  ip: string;
  userAgent: string;
  honeypot?: string;
  timeTakenMs?: number;
  browserSignature?: string;
  headers?: Headers;
}

export interface BotCheckResult {
  isBot: boolean;
  reason?: string;
}

const KNOWN_BOT_USER_AGENTS = [
  'curl',
  'python-requests',
  'postmanruntime',
  'postman',
  'headlesschrome',
  'phantomjs',
  'selenium',
  'puppeteer',
  'aiohttp',
  'urllib',
  'wget',
  'scrapy',
  'axios',
  'go-http-client',
  'httpclient',
  'java/',
  'libwww-perl',
];

export function detectBot(input: BotCheckInput): BotCheckResult {
  const { ip, userAgent, honeypot, timeTakenMs } = input;

  // 1. Honeypot check: humans never fill this hidden field; automated scrapers/bots do!
  if (honeypot && honeypot.trim() !== '') {
    return {
      isBot: true,
      reason: 'Honeypot field filled by automated script.',
    };
  }

  // 2. User-Agent check
  if (!userAgent || userAgent.trim() === '') {
    return {
      isBot: true,
      reason: 'Missing or empty User-Agent header.',
    };
  }

  const lowerUA = userAgent.toLowerCase();
  for (const botAgent of KNOWN_BOT_USER_AGENTS) {
    if (lowerUA.includes(botAgent)) {
      return {
        isBot: true,
        reason: `Automated user-agent detected (${botAgent}).`,
      };
    }
  }

  // 3. Timing heuristic check: submission faster than 400ms is automated
  if (typeof timeTakenMs === 'number' && timeTakenMs < 400 && timeTakenMs > 0) {
    return {
      isBot: true,
      reason: 'Unnaturally fast form submission (automated script).',
    };
  }

  return { isBot: false };
}
