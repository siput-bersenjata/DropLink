import { NextResponse } from 'next/server';
import { getExpiredFiles, markFilesExpired } from '@/lib/db/repository';
import { deleteObjectFromR2 } from '@/lib/storage/r2-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Optional cron secret verification for Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In production with CRON_SECRET configured, reject unauthorized callers
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const expiredFiles = await getExpiredFiles();
    const idsToMark: string[] = [];

    for (const file of expiredFiles) {
      idsToMark.push(file.id);
      await deleteObjectFromR2(file.r2Key);
    }

    let deletedCount = 0;
    if (idsToMark.length > 0) {
      deletedCount = await markFilesExpired(idsToMark);
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/cron/cleanup:', error);
    return NextResponse.json(
      { error: 'Gagal menjalankan pembersihan file kadaluarsa.' },
      { status: 500 }
    );
  }
}
