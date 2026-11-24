import crypto from 'crypto';
import { FileRecord, NewFileInput, UploadAuditLogRecord } from './schema';
import { DeviceAuditRecord } from '../audit/device-logger';
import { put, head } from '@vercel/blob';

// In-memory data store with global persistence across Next.js dev reloads
declare global {
  // eslint-disable-next-line no-var
  var __dropLinkDb: {
    files: Map<string, FileRecord>;
    auditLogs: UploadAuditLogRecord[];
  } | undefined;
}

function getStore() {
  if (!globalThis.__dropLinkDb) {
    globalThis.__dropLinkDb = {
      files: new Map(),
      auditLogs: [],
    };
  }
  return globalThis.__dropLinkDb;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function generateDeleteToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

async function persistMetadata(id: string, file: FileRecord): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(`metadata/${id}.json`, JSON.stringify(file), {
        access: 'public',
        addRandomSuffix: false,
      });
    } catch (err) {
      console.error('Failed to persist metadata to blob:', err);
    }
  }
}

export async function createFileRecord(
  input: NewFileInput,
  auditData: DeviceAuditRecord
): Promise<{ file: FileRecord; deleteToken: string }> {
  const store = getStore();
  const deleteToken = generateDeleteToken();
  const deleteTokenHash = hashToken(deleteToken);

  const file: FileRecord = {
    ...input,
    totalSize: input.totalSize ?? input.fileSize,
    files: input.files && input.files.length > 0
      ? input.files
      : [
          {
            id: '1',
            filename: input.filename,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
            category: input.category,
            r2Key: input.r2Key,
          },
        ],
    status: 'pending',
    deleteTokenHash,
    downloadCount: 0,
    createdAt: new Date(),
  };

  store.files.set(input.id, file);

  const logRecord: UploadAuditLogRecord = {
    id: crypto.randomUUID(),
    fileId: input.id,
    ipAddress: auditData.ipAddress,
    country: auditData.country,
    city: auditData.city,
    userAgent: auditData.userAgent,
    browserName: auditData.browserName,
    browserVersion: auditData.browserVersion,
    osName: auditData.osName,
    osVersion: auditData.osVersion,
    deviceType: auditData.deviceType,
    screenResolution: auditData.screenResolution,
    timezone: auditData.timezone,
    createdAt: new Date(auditData.createdAt || Date.now()),
  };

  store.auditLogs.push(logRecord);

  // Persist metadata to cloud blob so all serverless instances can read it
  await persistMetadata(input.id, file);

  return { file, deleteToken };
}

export async function activateFile(
  id: string,
  blobUrl?: string,
  fileUrls?: Array<{ filename: string; blobUrl: string }>
): Promise<boolean> {
  const store = getStore();
  let file = await getFileById(id);
  if (!file) return false;

  file.status = 'active';
  if (blobUrl) {
    file.r2Key = blobUrl;
  }

  if (fileUrls && fileUrls.length > 0 && file.files) {
    const urlMap = new Map(fileUrls.map((u) => [u.filename, u.blobUrl]));
    file.files = file.files.map((item) => ({
      ...item,
      blobUrl: urlMap.get(item.filename) || item.blobUrl || item.r2Key,
      r2Key: urlMap.get(item.filename) || item.r2Key,
    }));
  } else if (blobUrl && file.files && file.files.length === 1) {
    file.files[0].blobUrl = blobUrl;
    file.files[0].r2Key = blobUrl;
  }

  store.files.set(id, file);

  await persistMetadata(id, file);
  return true;
}

export async function getFileById(id: string): Promise<FileRecord | null> {
  const store = getStore();
  let file = store.files.get(id);
  if (file) {
    if (!file.files || file.files.length === 0) {
      file.files = [
        {
          id: '1',
          filename: file.filename,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          category: file.category,
          r2Key: file.r2Key,
          blobUrl: file.r2Key,
        },
      ];
      file.totalSize = file.fileSize;
    }
    return file;
  }

  // If not found in current serverless container memory, fetch from persistent cloud storage!
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobMeta = await head(`metadata/${id}.json`);
      if (blobMeta && blobMeta.url) {
        const res = await fetch(blobMeta.url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const fetchedFile: FileRecord = {
            ...data,
            totalSize: data.totalSize ?? data.fileSize,
            files:
              data.files && data.files.length > 0
                ? data.files
                : [
                    {
                      id: '1',
                      filename: data.filename,
                      fileSize: data.fileSize,
                      mimeType: data.mimeType,
                      category: data.category,
                      r2Key: data.r2Key,
                      blobUrl: data.r2Key,
                    },
                  ],
            createdAt: new Date(data.createdAt),
            expiresAt: new Date(data.expiresAt),
          };
          store.files.set(id, fetchedFile);
          return fetchedFile;
        }
      }
    } catch {
      // Not found in persistent storage
    }
  }

  return null;
}

export async function deleteFileWithToken(
  id: string,
  deleteToken: string
): Promise<{ success: boolean; r2Key?: string; error?: string }> {
  const store = getStore();
  const file = await getFileById(id);

  if (!file) {
    return { success: false, error: 'File tidak ditemukan.' };
  }

  const providedHash = hashToken(deleteToken);
  if (file.deleteTokenHash !== providedHash) {
    return { success: false, error: 'Delete token tidak valid.' };
  }

  file.status = 'deleted';
  store.files.set(id, file);

  // Update persistent metadata
  await persistMetadata(id, file);

  return { success: true, r2Key: file.r2Key };
}

export async function getExpiredFiles(): Promise<FileRecord[]> {
  const store = getStore();
  const now = new Date();
  const expired: FileRecord[] = [];

  for (const file of Array.from(store.files.values())) {
    if (file.status === 'active' && file.expiresAt <= now) {
      expired.push(file);
    }
  }

  return expired;
}

export async function markFilesExpired(ids: string[]): Promise<number> {
  const store = getStore();
  let count = 0;

  for (const id of ids) {
    const file = store.files.get(id);
    if (file && file.status === 'active') {
      file.status = 'expired';
      store.files.set(id, file);
      count++;
    }
  }

  return count;
}

export async function incrementDownloadCount(id: string): Promise<void> {
  const store = getStore();
  const file = store.files.get(id);
  if (file) {
    file.downloadCount += 1;
    store.files.set(id, file);
  }
}

export function resetDbForTesting(): void {
  const store = getStore();
  store.files.clear();
  store.auditLogs = [];
}
