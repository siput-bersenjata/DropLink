import { describe, it, expect, beforeEach } from 'vitest';
import {
  createFileRecord,
  getFileById,
  activateFile,
  deleteFileWithToken,
  getExpiredFiles,
  markFilesExpired,
  resetDbForTesting,
} from '@/lib/db/repository';

describe('Database Repository', () => {
  beforeEach(() => {
    resetDbForTesting();
  });

  it('should create a pending file record and retrieve it', async () => {
    const { file, deleteToken } = await createFileRecord(
      {
        id: 'test1234',
        filename: 'dokumen.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        category: 'document',
        r2Key: 'files/test1234/dokumen.pdf',
        retentionMonths: 1,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        ipAddress: '127.0.0.1',
        country: 'ID',
        city: 'Jakarta',
        userAgent: 'test-agent',
        browserName: 'Chrome',
        browserVersion: '122',
        osName: 'Windows',
        osVersion: '11',
        deviceType: 'desktop',
        screenResolution: '1920x1080',
        timezone: 'Asia/Jakarta',
        createdAt: new Date().toISOString(),
      }
    );

    expect(file.id).toBe('test1234');
    expect(file.status).toBe('pending');
    expect(deleteToken).toBeDefined();
    expect(deleteToken.length).toBeGreaterThan(10);

    const retrieved = await getFileById('test1234');
    expect(retrieved?.filename).toBe('dokumen.pdf');
    expect(retrieved?.status).toBe('pending');
  });

  it('should activate file status', async () => {
    await createFileRecord(
      {
        id: 'act123',
        filename: 'foto.jpg',
        fileSize: 50000,
        mimeType: 'image/jpeg',
        category: 'image',
        r2Key: 'files/act123/foto.jpg',
        retentionMonths: 1,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        ipAddress: '127.0.0.1',
        country: 'ID',
        city: 'Jakarta',
        userAgent: 'test',
        browserName: 'Chrome',
        browserVersion: '122',
        osName: 'Windows',
        osVersion: '11',
        deviceType: 'desktop',
        screenResolution: '1920x1080',
        timezone: 'Asia/Jakarta',
        createdAt: new Date().toISOString(),
      }
    );

    await activateFile('act123');
    const file = await getFileById('act123');
    expect(file?.status).toBe('active');
  });

  it('should delete file when valid delete token is provided', async () => {
    const { deleteToken } = await createFileRecord(
      {
        id: 'del123',
        filename: 'foto.jpg',
        fileSize: 50000,
        mimeType: 'image/jpeg',
        category: 'image',
        r2Key: 'files/del123/foto.jpg',
        retentionMonths: 3,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      {
        ipAddress: '127.0.0.1',
        country: 'ID',
        city: 'Bandung',
        userAgent: 'test',
        browserName: 'Firefox',
        browserVersion: '120',
        osName: 'Linux',
        osVersion: 'Ubuntu',
        deviceType: 'desktop',
        screenResolution: '1366x768',
        timezone: 'UTC',
        createdAt: new Date().toISOString(),
      }
    );

    const deleteResult = await deleteFileWithToken('del123', deleteToken);
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.r2Key).toBe('files/del123/foto.jpg');

    const retrieved = await getFileById('del123');
    expect(retrieved?.status).toBe('deleted');

    const invalidDelete = await deleteFileWithToken('del123', 'wrong-token');
    expect(invalidDelete.success).toBe(false);
  });

  it('should query expired active files and mark them expired', async () => {
    // Add expired file
    await createFileRecord(
      {
        id: 'exp123',
        filename: 'old.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        category: 'document',
        r2Key: 'files/exp123/old.pdf',
        retentionMonths: 1,
        expiresAt: new Date(Date.now() - 10000), // in the past
      },
      {
        ipAddress: '127.0.0.1',
        country: 'ID',
        city: 'Surabaya',
        userAgent: 'test',
        browserName: 'Edge',
        browserVersion: '121',
        osName: 'Windows',
        osVersion: '10',
        deviceType: 'desktop',
        screenResolution: '1920x1080',
        timezone: 'Asia/Jakarta',
        createdAt: new Date().toISOString(),
      }
    );
    await activateFile('exp123');

    const expired = await getExpiredFiles();
    expect(expired.length).toBe(1);
    expect(expired[0].id).toBe('exp123');

    const markedCount = await markFilesExpired(['exp123']);
    expect(markedCount).toBe(1);

    const after = await getFileById('exp123');
    expect(after?.status).toBe('expired');
  });
});
