import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generatePresignedUploadUrl,
  getPublicDownloadUrl,
  deleteObjectFromR2,
  isR2Configured,
} from '@/lib/storage/r2-client';

describe('Cloudflare R2 Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should format public download url correctly', () => {
    const url = getPublicDownloadUrl('uploads/abc/test.png', 'test.png');
    expect(url).toBeDefined();
    expect(url).toContain('uploads/abc/test.png');
  });

  it('should generate presigned upload url in test/configured environment', async () => {
    const url = await generatePresignedUploadUrl(
      'uploads/test/sample.jpg',
      'image/jpeg'
    );
    expect(url).toBeDefined();
    expect(url).toContain('uploads/test/sample.jpg');
  });

  it('should delete object from R2 without throwing', async () => {
    const success = await deleteObjectFromR2('uploads/test/sample.jpg');
    expect(typeof success).toBe('boolean');
  });

  it('should check if R2 is configured', () => {
    const configured = isR2Configured();
    expect(typeof configured).toBe('boolean');
  });
});
