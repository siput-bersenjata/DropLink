'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  FileX,
  Download,
  Copy,
  Check,
  Clock,
  Trash2,
  Shield,
  Calendar,
  Layers,
  FileText,
  Image as ImageIcon,
  Video,
  ExternalLink,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MediaViewer from '@/components/preview/MediaViewer';
import DeleteConfirmationModal from '@/components/preview/DeleteConfirmationModal';
import { formatBytes, FileCategory } from '@/lib/validation/file-validator';

interface FileItem {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  category: FileCategory;
  downloadUrl: string;
}

interface BatchDetails {
  id: string;
  filename: string;
  fileSize: number;
  totalSize: number;
  mimeType: string;
  category: FileCategory;
  status: string;
  fileCount: number;
  files: FileItem[];
  downloadCount: number;
  createdAt: string;
  expiresAt: string;
  downloadUrl: string;
}

export default function FilePreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [batch, setBatch] = useState<BatchDetails | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [savedOwnerToken, setSavedOwnerToken] = useState<string>('');

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

        const data: BatchDetails = await res.json();
        setBatch(data);
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

  useEffect(() => {
    if (!id) return;
    try {
      const keys = JSON.parse(localStorage.getItem('droplink_owner_keys') || '{}');
      if (keys[id]) {
        setSavedOwnerToken(keys[id]);
      }
    } catch {
      // Ignore localStorage error
    }
  }, [id]);

  const handleFileDeleted = () => {
    alert('File telah berhasil dihapus secara permanen.');
    router.push('/');
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const activeFile = batch?.files ? batch.files[selectedFileIndex] || batch.files[0] : null;

  // Calculate remaining days
  const expiryDate = batch?.expiresAt ? new Date(batch.expiresAt) : new Date();
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const expiryString = expiryDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getFileIcon = (cat: string) => {
    switch (cat) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />;
    }
  };

  const downloadAllFiles = () => {
    if (!batch || !batch.files) return;
    batch.files.forEach((f, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = f.downloadUrl;
        link.download = f.filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 400);
    });
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
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
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
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Utama</span>
            </Link>
          </div>
        )}

        {!loading && batch && activeFile && (
          <div className="w-full">
            {/* Top Navigation & Back Link */}
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Upload File Baru</span>
              </Link>

              {/* Expiry Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold shadow-sm">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{diffDays > 0 ? `${diffDays} hari lagi` : 'Segera kedaluwarsa'}</span>
              </div>
            </div>

            {/* Media Viewer for Selected File */}
            <div className="shadow-[0_20px_45px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden mb-6">
              <MediaViewer
                filename={activeFile.filename}
                category={activeFile.category}
                downloadUrl={activeFile.downloadUrl}
                mimeType={activeFile.mimeType}
              />
            </div>

            {/* Batch & Files Card with 3D Shadow Depth */}
            <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(37,99,235,0.08),0_8px_20px_rgba(0,0,0,0.04)] p-6 sm:p-8 text-left">
              {/* Batch Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Layers className="w-3 h-3" />
                      {batch.files.length} File Tersedia
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Total {formatBytes(batch.totalSize || batch.fileSize)}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate" title={activeFile.filename}>
                    {activeFile.filename}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700">{formatBytes(activeFile.fileSize)}</span>
                    <span>•</span>
                    <span className="capitalize font-medium">{activeFile.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      Diunggah {new Date(batch.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </p>
                </div>

                {/* Primary Download Button for Active File */}
                <div className="flex items-center gap-2">
                  <a
                    href={activeFile.downloadUrl}
                    download={activeFile.filename}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-2.5 rounded-xl shadow-[0_4px_0_0_#1d4ed8,0_8px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_2px_0_0_#1d4ed8] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Download File Ini</span>
                  </a>
                </div>
              </div>

              {/* Multi-File List (if more than 1 file) */}
              {batch.files.length > 1 && (
                <div className="py-5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Pilih File untuk Dilihat / Diunduh:
                    </h3>
                    <button
                      type="button"
                      onClick={downloadAllFiles}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh Semua File ({batch.files.length})</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {batch.files.map((f, index) => {
                      const isSelected = selectedFileIndex === index;
                      return (
                        <div
                          key={f.id || index}
                          onClick={() => setSelectedFileIndex(index)}
                          className={`cursor-pointer rounded-2xl border p-3 flex items-center justify-between gap-3 transition-all ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-300 shadow-[0_2px_10px_rgba(37,99,235,0.12)] ring-1 ring-blue-500'
                              : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                            {getFileIcon(f.category)}
                            <div className="truncate">
                              <p className={`text-xs truncate ${isSelected ? 'font-bold text-blue-900' : 'font-medium text-slate-800'}`}>
                                {f.filename}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {formatBytes(f.fileSize)}
                              </p>
                            </div>
                          </div>

                          <a
                            href={f.downloadUrl}
                            download={f.filename}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors shadow-sm flex-shrink-0"
                            title="Unduh file ini langsung"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Security & Retention Info */}
              <div className="py-4 text-xs text-slate-600 flex items-center gap-2 border-b border-slate-100">
                <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  File disimpan terenkripsi dan otomatis dihapus permanen pada tanggal <b>{expiryString}</b>.
                </span>
              </div>

              {/* Bottom Actions */}
              <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="flex-1 sm:flex-initial bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Link Halaman Ini</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Owner Delete Button */}
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 hover:underline py-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus File Ini Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {batch && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          fileId={batch.id}
          defaultToken={savedOwnerToken}
          onSuccess={handleFileDeleted}
        />
      )}

      <Footer />
    </div>
  );
}
