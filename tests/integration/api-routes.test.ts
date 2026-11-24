import { describe, it, expect, beforeEach } from 'vitest';
import { POST as presignHandler } from '@/app/api/upload/presign/route';
import { POST as completeHandler } from '@/app/api/upload/complete/route';
import { GET as getFileHandler } from '@/app/api/file/[id]/route';
import { POST as deleteFileHandler } from '@/app/api/file/[id]/delete/route';
import { GET as cleanupCronHandler } from '@/app/api/cron/cleanup/route';
import { resetDbForTesting } from '@/lib/db/repository';
import { resetRateLimiterForTesting } from '@/lib/security/rate-limiter';

describe('API Route Handlers', () => {
  beforeEach(() => {
    resetDbForTesting();
    resetRateLimiterForTesting();
  });

  it('should reject presign request if turnstile token is missing', async () => {
    const req = new Request('http://localhost:3000/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'foto.jpg',
        size: 1024,
        retentionMonths: 1,
        turnstileToken: '',
      }),
    });

    const res = await presignHandler(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('captcha');
  });

  it('should reject presign request if file validation fails (e.g. image over 20MB)', async () => {
    const req = new Request('http://localhost:3000/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'huge_image.png',
        size: 25 * 1024 * 1024,
        retentionMonths: 1,
        turnstileToken: 'valid-test-token',
      }),
    });

    const res = await presignHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('20MB');
  });

  it('should issue presigned URL and create pending file on valid request', async () => {
    const req = new Request('http://localhost:3000/api/upload/presign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '110.23.45.67',
      },
      body: JSON.stringify({
        filename: 'dokumen-rahasia.pdf',
        size: 5 * 1024 * 1024,
        retentionMonths: 3,
        turnstileToken: 'valid-test-token',
        clientInfo: {
          screenResolution: '1920x1080',
          timezone: 'Asia/Jakarta',
        },
      }),
    });

    const res = await presignHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.fileId).toBeDefined();
    expect(data.presignedUrl).toBeDefined();
    expect(data.deleteToken).toBeDefined();
    expect(data.publicUrl).toBeDefined();

    // Now test completeHandler
    const completeReq = new Request('http://localhost:3000/api/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: data.fileId }),
    });

    const completeRes = await completeHandler(completeReq);
    expect(completeRes.status).toBe(200);

    // Now test getFileHandler
    const getRes = await getFileHandler(new Request(`http://localhost:3000/api/file/${data.fileId}`), {
      params: { id: data.fileId },
    });
    expect(getRes.status).toBe(200);
    const fileData = await getRes.json();
    expect(fileData.filename).toBe('dokumen-rahasia.pdf');
    expect(fileData.status).toBe('active');

    // Test deleteFileHandler
    const deleteReq = new Request(
      `http://localhost:3000/api/file/${data.fileId}/delete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteToken: data.deleteToken }),
      }
    );
    const deleteRes = await deleteFileHandler(deleteReq, {
      params: { id: data.fileId },
    });
    expect(deleteRes.status).toBe(200);
  });

  it('should run cleanup cron successfully', async () => {
    const cronReq = new Request('http://localhost:3000/api/cron/cleanup');
    const cronRes = await cleanupCronHandler(cronReq);
    expect(cronRes.status).toBe(200);
    const result = await cronRes.json();
    expect(typeof result.deletedCount).toBe('number');
  });
});
