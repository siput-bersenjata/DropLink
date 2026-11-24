import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { validateFile, calculateExpiryDate } from '@/lib/validation/file-validator';
import { parseClientDeviceInfo, extractClientIp } from '@/lib/audit/device-logger';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import { generatePresignedUploadUrl } from '@/lib/storage/r2-client';
import { createFileRecord } from '@/lib/db/repository';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filename, size, mimeType, retentionMonths, turnstileToken, clientInfo } = body;

    // 1. Rate limiting
    const ip = extractClientIp(request.headers);
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error:
            'Batas upload tercapai (maksimal 10 upload per jam per IP). Silakan coba lagi nanti.',
        },
        { status: 429 }
      );
    }

    // 2. Turnstile Verification
    const isCaptchaValid = await verifyTurnstileToken(turnstileToken, ip);
    if (!isCaptchaValid) {
      return NextResponse.json(
        { error: 'Verifikasi captcha (Turnstile) diperlukan atau tidak valid.' },
        { status: 403 }
      );
    }

    // 3. File Validation
    const validation = validateFile({ filename, size, mimeType });
    if (!validation.valid || !validation.category) {
      return NextResponse.json(
        { error: validation.error || 'File tidak valid.' },
        { status: 400 }
      );
    }

    // 4. Calculate Expiry
    const months = Number(retentionMonths) || 1;
    let expiresAt: Date;
    try {
      expiresAt = calculateExpiryDate(months);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // 5. Parse Device & IP Audit Info
    const auditRecord = parseClientDeviceInfo(request.headers, clientInfo);

    // 6. Generate Short File ID & Cloudflare R2 Key
    const fileId = nanoid(10);
    // Sanitize filename for S3 key storage
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `uploads/${fileId}/${safeFilename}`;

    // 7. Generate Cloudflare R2 Presigned S3 PUT URL
    const presignedUrl = await generatePresignedUploadUrl(
      r2Key,
      mimeType || 'application/octet-stream',
      600 // 10 minutes
    );

    // 8. Create Pending Record in DB
    const { file, deleteToken } = await createFileRecord(
      {
        id: fileId,
        filename,
        fileSize: size,
        mimeType: mimeType || 'application/octet-stream',
        category: validation.category,
        r2Key,
        retentionMonths: months,
        expiresAt,
      },
      auditRecord
    );

    const publicUrl = `/f/${fileId}`;

    return NextResponse.json({
      fileId: file.id,
      presignedUrl,
      deleteToken,
      publicUrl,
      expiresAt: file.expiresAt,
      category: file.category,
    });
  } catch (error: any) {
    console.error('Error in /api/upload/presign:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat memproses upload.' },
      { status: 500 }
    );
  }
}
