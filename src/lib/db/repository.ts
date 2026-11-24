import crypto from 'crypto';
import { FileRecord, NewFileInput, UploadAuditLogRecord } from './schema';
import { DeviceAuditRecord } from '../audit/device-logger';

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

export async function createFileRecord(
  input: NewFileInput,
  auditData: DeviceAuditRecord
): Promise<{ file: FileRecord; deleteToken: string }> {
  const store = getStore();
  const deleteToken = generateDeleteToken();
  const deleteTokenHash = hashToken(deleteToken);

  const file: FileRecord = {
    ...input,
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

  return { file, deleteToken };
}

export async function activateFile(id: string): Promise<boolean> {
  const store = getStore();
  const file = store.files.get(id);
  if (!file) return false;

  file.status = 'active';
  store.files.set(id, file);
  return true;
}

export async function getFileById(id: string): Promise<FileRecord | null> {
  const store = getStore();
  const file = store.files.get(id);
  if (!file) return null;
  return file;
}

export async function deleteFileWithToken(
  id: string,
  deleteToken: string
): Promise<{ success: boolean; r2Key?: string; error?: string }> {
  const store = getStore();
  const file = store.files.get(id);

  if (!file) {
    return { success: false, error: 'File tidak ditemukan.' };
  }

  const providedHash = hashToken(deleteToken);
  if (file.deleteTokenHash !== providedHash) {
    return { success: false, error: 'Delete token tidak valid.' };
  }

  file.status = 'deleted';
  store.files.set(id, file);

  return { success: true, r2Key: file.r2Key };
}

export async function getExpiredFiles(): Promise<FileRecord[]> {
  const store = getStore();
  const now = new Date();
  const expired: FileRecord[] = [];

  for (const file of store.files.values()) {
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
