import { NextResponse } from 'next/server';
import { activateFile, getFileById } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: 'Parameter fileId diperlukan.' },
        { status: 400 }
      );
    }

    const file = await getFileById(fileId);
    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan.' },
        { status: 404 }
      );
    }

    await activateFile(fileId);

    return NextResponse.json({ success: true, fileId });
  } catch (error) {
    console.error('Error in /api/upload/complete:', error);
    return NextResponse.json(
      { error: 'Gagal menyelesaikan proses upload.' },
      { status: 500 }
    );
  }
}
