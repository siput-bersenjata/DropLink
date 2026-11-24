import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'drop-link-storage';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

export function isR2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID || 'dummy-account'}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || 'dummy-key',
        secretAccessKey: R2_SECRET_ACCESS_KEY || 'dummy-secret',
      },
    });
  }
  return s3ClientInstance;
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 600
): Promise<string> {
  if (!isR2Configured()) {
    // Mock presigned URL for local development/testing without live credentials
    return `https://mock-r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}?mock-presigned=true&expires=${expiresInSeconds}`;
  }

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function generatePresignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  if (!isR2Configured()) {
    return `https://mock-r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}?mock-download=true`;
  }

  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function deleteObjectFromR2(key: string): Promise<boolean> {
  if (!isR2Configured()) {
    return true;
  }

  try {
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting object from Cloudflare R2:', error);
    return false;
  }
}

export function getPublicDownloadUrl(key: string, filename?: string): string {
  if (R2_PUBLIC_DOMAIN) {
    const base = R2_PUBLIC_DOMAIN.endsWith('/')
      ? R2_PUBLIC_DOMAIN.slice(0, -1)
      : R2_PUBLIC_DOMAIN;
    return `${base}/${key}`;
  }

  // Fallback to internal streaming route
  return `/api/raw/${key}${filename ? `?filename=${encodeURIComponent(filename)}` : ''}`;
}
