'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, FileX } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MediaViewer from '@/components/preview/MediaViewer';
import FileDetailsCard from '@/components/preview/FileDetailsCard';

interface FileDetails {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  category: 'image' | 'video' | 'document';
  status: string;
  downloadCount: number;
  createdAt: string;
  expiresAt: string;
  downloadUrl: string;
}

export default function FilePreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [file, setFile] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFile() {
      try {
        setLoading(true);
        const res = await fetch(`/api/file/${id}`);
        if (!res.ok) {
          setErrorStatus(res.status);
          const data = await res.json();
          setErrorMessage(data.error || 'File tidak dapat diakses.');
          return;
        }

        const data: FileDetails = await res.json();
        setFile(data);
      } catch (err: any) {
        setErrorStatus(500);
        setErrorMessage(err.message || 'Gagal memuat file.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchFile();
    }
  }, [id]);

  const handleFileDeleted = () => {
    alert('File telah berhasil dihapus secara permanen.');
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        {loading && (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Memuat pratinjau file...</p>
          </div>
        )}

        {!loading && errorStatus && (
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <FileX className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {errorStatus === 410 ? 'File Kedaluwarsa / Dihapus' : 'File Tidak Ditemukan'}
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {errorMessage || 'File ini sudah tidak tersedia atau link salah.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Utama</span>
            </Link>
          </div>
        )}

        {!loading && file && (
          <div className="w-full">
            {/* Back link */}
            <div className="mb-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Upload File Baru</span>
              </Link>
            </div>

            {/* Media Viewer */}
            <MediaViewer
              filename={file.filename}
              category={file.category}
              downloadUrl={file.downloadUrl}
              mimeType={file.mimeType}
            />

            {/* Details & Actions Card */}
            <FileDetailsCard
              id={file.id}
              filename={file.filename}
              fileSize={file.fileSize}
              category={file.category}
              downloadUrl={file.downloadUrl}
              expiresAt={file.expiresAt}
              createdAt={file.createdAt}
              onDeleted={handleFileDeleted}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
