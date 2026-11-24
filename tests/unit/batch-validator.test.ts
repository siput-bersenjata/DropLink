import { describe, it, expect } from 'vitest';
import { validateBatch } from '@/lib/validation/file-validator';

describe('validateBatch', () => {
  it('should validate a batch of mixed files (photo and document)', () => {
    const files = [
      { filename: 'photo.jpg', size: 5 * 1024 * 1024, mimeType: 'image/jpeg' },
      { filename: 'report.pdf', size: 10 * 1024 * 1024, mimeType: 'application/pdf' },
    ];

    const result = validateBatch(files);
    expect(result.valid).toBe(true);
    expect(result.fileCount).toBe(2);
    expect(result.totalSize).toBe(15 * 1024 * 1024);
    expect(result.items[0].category).toBe('image');
    expect(result.items[1].category).toBe('document');
  });

  it('should reject when total size exceeds 50MB', () => {
    const files = [
      { filename: 'doc1.pdf', size: 30 * 1024 * 1024 },
      { filename: 'doc2.pdf', size: 25 * 1024 * 1024 },
    ];

    const result = validateBatch(files);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('melebihi batas maksimal 50MB');
  });

  it('should reject when an individual image exceeds 20MB', () => {
    const files = [
      { filename: 'huge.png', size: 22 * 1024 * 1024, mimeType: 'image/png' },
      { filename: 'notes.txt', size: 1024, mimeType: 'text/plain' },
    ];

    const result = validateBatch(files);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Ukuran gambar melebihi batas maksimal 20MB');
  });

  it('should reject dangerous executable files inside a batch', () => {
    const files = [
      { filename: 'safe.png', size: 1024, mimeType: 'image/png' },
      { filename: 'virus.exe', size: 2048, mimeType: 'application/x-msdownload' },
    ];

    const result = validateBatch(files);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('berpotensi berbahaya');
  });

  it('should reject empty batch', () => {
    const result = validateBatch([]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Pilih minimal satu file');
  });

  it('should reject more than 20 files in a single batch', () => {
    const files = Array.from({ length: 21 }, (_, i) => ({
      filename: `doc_${i}.txt`,
      size: 100,
    }));

    const result = validateBatch(files);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Maksimal 20 file');
  });
});
