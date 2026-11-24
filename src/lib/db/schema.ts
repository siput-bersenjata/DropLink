import { FileCategory } from '../validation/file-validator';

export type FileStatus = 'pending' | 'active' | 'expired' | 'deleted';

export interface FileRecord {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  category: FileCategory;
  r2Key: string;
  retentionMonths: number;
  status: FileStatus;
  deleteTokenHash: string;
  downloadCount: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface NewFileInput {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  category: FileCategory;
  r2Key: string;
  retentionMonths: number;
  expiresAt: Date;
}

export interface UploadAuditLogRecord {
  id: string;
  fileId: string;
  ipAddress: string;
  country: string;
  city: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: string;
  screenResolution: string;
  timezone: string;
  createdAt: Date;
}
