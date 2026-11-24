import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import {
  validateBatch,
  calculateExpiryDate,
} from '@/lib/validation/file-validator';
import { parseClientDeviceInfo, extractClientIp } from '@/lib/audit/device-logger';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { detectBot } from '@/lib/security/bot-detector';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import { generatePresignedUploadUrl } from '@/lib/storage/r2-client';
import { createFileRecord } from '@/lib/db/repository';
import { FileItemRecord } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      filename,
      size,
      mimeType,
      files: rawFiles,
      retentionMonths,
      turnstileToken,
      honeypot,
      timeTakenMs,
      clientInfo,
    } = body;

    const userAgent = request.headers.get('user-agent') || '';
    const ip = extractClientIp(request.headers);

    // 1. Invisible Bot Detection (Honeypot, User-Agent, Automation Timing)
    const botCheck = detectBot({
      ip,
      userAgent,
      honeypot,
      timeTakenMs,
      headers: request.headers,
    });

    if (botCheck.isBot) {
      return NextResponse.json(
        {
          error: 'BOT_DETECTED',
          isBotBlocked: true,
          message:
            'Akses diblokir: Terdeteksi aktivitas script atau bot otomatis. Harap gunakan browser standar.',
          reason: botCheck.reason,
        },
        { status: 403 }
      );
    }

    // Optional Turnstile verification if secret key is explicitly set in production
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const isCaptchaValid = await verifyTurnstileToken(turnstileToken, ip);
      if (!isCaptchaValid) {
        return NextResponse.json(
          {
            error: 'BOT_DETECTED',
            isBotBlocked: true,
            message: 'Verifikasi keamanan bot gagal. Harap muat ulang halaman.',
          },
          { status: 403 }
        );
      }
    }

    // 2. IP Rate limiting
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          isBotBlocked: true,
          isRateLimit: true,
          message:
            'Batas upload tercapai (maksimal 10 upload per jam per IP). Silakan coba lagi nanti untuk mencegah abuse.',
        },
        { status: 429 }
      );
    }

    // 3. Normalize single vs multi file input
    const fileListToValidate: Array<{ filename: string; size: number; mimeType?: string }> =
      rawFiles && Array.isArray(rawFiles) && rawFiles.length > 0
        ? rawFiles
        : [{ filename, size, mimeType }];

    // 4. File Validation
    const batchValidation = validateBatch(fileListToValidate);
    if (!batchValidation.valid) {
      return NextResponse.json(
        { error: batchValidation.error || 'File tidak valid.' },
        { status: 400 }
      );
    }

    // 5. Calculate Expiry
    const months = Number(retentionMonths) || 1;
    let expiresAt: Date;
    try {
      expiresAt = calculateExpiryDate(months);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // 6. Parse Device & IP Audit Info
    const auditRecord = parseClientDeviceInfo(request.headers, clientInfo);

    // 7. Generate Short File ID
    const fileId = nanoid(10);
    const useVercelBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

    // 8. Prepare File Items
    const fileItems: FileItemRecord[] = [];
    for (let i = 0; i < batchValidation.items.length; i++) {
      const item = batchValidation.items[i];
      const safeFilename = item.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const r2Key = `uploads/${fileId}/${safeFilename}`;
      fileItems.push({
        id: nanoid(8),
        filename: item.filename,
        fileSize: item.size,
        mimeType: item.mimeType,
        category: item.category,
        r2Key,
      });
    }

    const primaryItem = fileItems[0];
    const presignedUrl = await generatePresignedUploadUrl(
      primaryItem.r2Key,
      primaryItem.mimeType,
      600
    );

    // 9. Create Pending Record in DB
    const { file, deleteToken } = await createFileRecord(
      {
        id: fileId,
        filename: primaryItem.filename,
        fileSize: primaryItem.fileSize,
        mimeType: primaryItem.mimeType,
        category: primaryItem.category,
        r2Key: primaryItem.r2Key,
        files: fileItems,
        totalSize: batchValidation.totalSize,
        retentionMonths: months,
        expiresAt,
      },
      auditRecord
    );

    const publicUrl = `/f/${fileId}`;

    return NextResponse.json({
      fileId: file.id,
      presignedUrl,
      useVercelBlob,
      deleteToken,
      publicUrl,
      expiresAt: file.expiresAt,
      totalSize: file.totalSize,
      fileCount: fileItems.length,
      category: file.category,
      files: fileItems.map((f) => ({
        id: f.id,
        filename: f.filename,
        fileSize: f.fileSize,
        category: f.category,
        r2Key: f.r2Key,
      })),
    });
  } catch (error: any) {
    console.error('Error in /api/upload/presign:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat memproses upload.' },
      { status: 500 }
    );
  }
}
