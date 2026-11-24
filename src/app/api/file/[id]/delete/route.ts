import { NextResponse } from 'next/server';
import { deleteFileWithToken } from '@/lib/db/repository';
import { deleteObjectFromR2 } from '@/lib/storage/r2-client';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { deleteToken } = body;

    if (!deleteToken) {
      return NextResponse.json(
        { error: 'Delete token diperlukan untuk menghapus file.' },
        { status: 400 }
      );
    }

    const result = await deleteFileWithToken(id, deleteToken);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Gagal menghapus file. Token tidak cocok.' },
        { status: 403 }
      );
    }

    if (result.r2Key) {
      await deleteObjectFromR2(result.r2Key);
    }

    return NextResponse.json({
      success: true,
      message: 'File berhasil dihapus secara permanen.',
    });
  } catch (error) {
    console.error('Error in /api/file/[id]/delete:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus file.' },
      { status: 500 }
    );
  }
}
