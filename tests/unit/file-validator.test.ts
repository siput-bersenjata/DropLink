import { describe, it, expect } from 'vitest';
import { validateFile, calculateExpiryDate, FILE_LIMITS } from '@/lib/validation/file-validator';

describe('File Validator', () => {
  it('should accept image under 20MB', () => {
    const result = validateFile({ filename: 'photo.png', size: 15 * 1024 * 1024, mimeType: 'image/png' });
    expect(result.valid).toBe(true);
    expect(result.category).toBe('image');
  });

  it('should reject image over 20MB', () => {
    const result = validateFile({ filename: 'heavy.jpg', size: 21 * 1024 * 1024, mimeType: 'image/jpeg' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('20MB');
  });

  it('should accept video under 50MB', () => {
    const result = validateFile({ filename: 'clip.mp4', size: 45 * 1024 * 1024, mimeType: 'video/mp4' });
    expect(result.valid).toBe(true);
    expect(result.category).toBe('video');
  });

  it('should reject video over 50MB', () => {
    const result = validateFile({ filename: 'movie.mp4', size: 55 * 1024 * 1024, mimeType: 'video/mp4' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('50MB');
  });

  it('should accept document under 50MB', () => {
    const result = validateFile({ filename: 'laporan.pdf', size: 10 * 1024 * 1024, mimeType: 'application/pdf' });
    expect(result.valid).toBe(true);
    expect(result.category).toBe('document');
  });

  it('should reject document over 50MB', () => {
    const result = validateFile({ filename: 'big_archive.zip', size: 52 * 1024 * 1024, mimeType: 'application/zip' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('50MB');
  });

  it('should reject dangerous executable files', () => {
    const result = validateFile({ filename: 'malware.exe', size: 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('tidak didukung');
  });

  it('should calculate expiry date accurately for 1, 3, 6 months', () => {
    const now = new Date();
    const expiry1 = calculateExpiryDate(1);
    const diffDays1 = Math.round((expiry1.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays1).toBeGreaterThanOrEqual(28);
    expect(diffDays1).toBeLessThanOrEqual(31);

    const expiry3 = calculateExpiryDate(3);
    const diffDays3 = Math.round((expiry3.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays3).toBeGreaterThanOrEqual(88);
    expect(diffDays3).toBeLessThanOrEqual(93);

    const expiry6 = calculateExpiryDate(6);
    const diffDays6 = Math.round((expiry6.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays6).toBeGreaterThanOrEqual(180);
    expect(diffDays6).toBeLessThanOrEqual(185);
  });

  it('should reject invalid retention months', () => {
    expect(() => calculateExpiryDate(2)).toThrow();
  });
});
