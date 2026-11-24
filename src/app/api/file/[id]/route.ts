import { NextResponse } from 'next/server';
import { getFileById, incrementDownloadCount } from '@/lib/db/repository';
import { getPublicDownloadUrl, deleteObjectFromR2 } from '@/lib/storage/r2-client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const file = await getFileById(id);

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan atau telah dihapus.' },
        { status: 404 }
      );
    }

    if (file.status === 'deleted') {
      return NextResponse.json(
        { error: 'File ini telah dihapus oleh pengunggah.' },
        { status: 410 }
      );
    }

    const now = new Date();
    if (file.status === 'expired' || file.expiresAt <= now) {
      // Soft-trigger background cleanup if expired
      deleteObjectFromR2(file.r2Key).catch(console.error);
      return NextResponse.json(
        { error: 'File ini telah melewati masa aktif (kedaluwarsa).' },
        { status: 410 }
      );
    }

    await incrementDownloadCount(id);
    const downloadUrl = getPublicDownloadUrl(file.r2Key, file.filename);

    return NextResponse.json({
      id: file.id,
      filename: file.filename,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      category: file.category,
      status: file.status,
      downloadCount: file.downloadCount,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt,
      downloadUrl,
    });
  } catch (error) {
    console.error('Error in /api/file/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil detail file.' },
      { status: 500 }
    );
  }
}
