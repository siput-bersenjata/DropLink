const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';
const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(
  token?: string,
  remoteIp?: string
): Promise<boolean> {
  if (!token || token.trim() === '') {
    return false;
  }

  // If secret key is not set (e.g. local development or unit test environment),
  // accept the dummy/test tokens.
  if (!TURNSTILE_SECRET_KEY || process.env.NODE_ENV === 'test') {
    return true;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (remoteIp && remoteIp !== '127.0.0.1') {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      console.error(
        'Cloudflare Turnstile verification failed with HTTP status:',
        response.status
      );
      return false;
    }

    const data = await response.json();
    return Boolean(data.success);
  } catch (error) {
    console.error('Error contacting Cloudflare Turnstile API:', error);
    return false;
  }
}
