'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  AlertCircle,
  Loader2,
  X,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { upload as vercelBlobUpload } from '@vercel/blob/client';
import {
  validateBatch,
  formatBytes,
  RetentionMonths,
  FileCategory,
  getFileExtension,
} from '@/lib/validation/file-validator';
import { saveToHistory } from '@/lib/storage/history-store';
import RetentionSelector from './RetentionSelector';
import SuccessCard, { SuccessUploadedFile } from './SuccessCard';

export default function Dropzone() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [retention, setRetention] = useState<RetentionMonths>(1);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Success state
  const [successData, setSuccessData] = useState<{
    fileId: string;
    publicUrl: string;
    deleteToken: string;
    expiresAt: string;
    totalSize: number;
    files: SuccessUploadedFile[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFilesToSelection = useCallback((newFiles: FileList | File[]) => {
    setErrorMsg(null);
    const incoming = Array.from(newFiles);

    setSelectedFiles((prev) => {
      // Merge unique by name + size
      const existingNames = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const filteredIncoming = incoming.filter(
        (f) => !existingNames.has(`${f.name}-${f.size}`)
      );
      const combined = [...prev, ...filteredIncoming];

      // Validate batch
      const validation = validateBatch(
        combined.map((f) => ({
          filename: f.name,
          size: f.size,
          mimeType: f.type,
        }))
      );

      if (!validation.valid) {
        setErrorMsg(validation.error || 'Beberapa file tidak valid.');
        return prev;
      }

      return combined;
    });
  }, []);

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0) {
        const validation = validateBatch(
          updated.map((f) => ({
            filename: f.name,
            size: f.size,
            mimeType: f.type,
          }))
        );
        if (!validation.valid) {
          setErrorMsg(validation.error || null);
        } else {
          setErrorMsg(null);
        }
      } else {
        setErrorMsg(null);
      }
      return updated;
    });
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFilesToSelection(e.dataTransfer.files);
      }
    },
    [addFilesToSelection]
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToSelection(e.target.files);
    }
  };

  const totalSelectedSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const getCategoryIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
    }
    if (file.type.startsWith('video/')) {
      return <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />;
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg('Pilih minimal satu file sebelum membuat link.');
      return;
    }

    if (!turnstileToken) {
      setErrorMsg('Harap selesaikan verifikasi keamanan captcha di bawah.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatusText('Menyiapkan server & enkripsi link...');
    setErrorMsg(null);

    try {
      const screenResolution =
        typeof window !== 'undefined'
          ? `${window.screen.width}x${window.screen.height}`
          : 'Unknown';
      const timezone =
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : 'UTC';

      // 1. Presign batch upload
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: selectedFiles.map((f) => ({
            filename: f.name,
            size: f.size,
            mimeType: f.type || 'application/octet-stream',
          })),
          retentionMonths: retention,
          turnstileToken,
          clientInfo: {
            screenResolution,
            timezone,
          },
        }),
      });

      if (!presignRes.ok) {
        const errData = await presignRes.json();
        throw new Error(errData.error || 'Gagal memulai proses upload.');
      }

      const {
        fileId,
        deleteToken,
        publicUrl,
        expiresAt,
        totalSize,
        files: presignedFiles,
        useVercelBlob,
        presignedUrl,
      } = await presignRes.json();

      const uploadedFilesUrls: Array<{ filename: string; blobUrl: string }> = [];

      // 2. Upload files
      if (useVercelBlob) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const currentFile = selectedFiles[i];
          setUploadStatusText(
            `Mengunggah file ${i + 1} dari ${selectedFiles.length} (${currentFile.name})...`
          );

          const blob = await vercelBlobUpload(
            `uploads/${fileId}/${currentFile.name}`,
            currentFile,
            {
              access: 'public',
              handleUploadUrl: '/api/upload/blob',
              onUploadProgress: (progress) => {
                const singleWeight = 100 / selectedFiles.length;
                const totalProgress = Math.round(
                  i * singleWeight + (progress.percentage / 100) * singleWeight
                );
                setUploadProgress(totalProgress);
              },
            }
          );

          uploadedFilesUrls.push({
            filename: currentFile.name,
            blobUrl: blob.url,
          });
        }
      } else {
        // Fallback R2 PUT for single file
        setUploadStatusText('Mengunggah file ke cloud storage...');
        const singleFile = selectedFiles[0];
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload storage gagal (Status: ${xhr.status}).`));
          };
          xhr.onerror = () => reject(new Error('Koneksi jaringan terputus saat upload.'));
          xhr.open('PUT', presignedUrl);
          xhr.setRequestHeader('Content-Type', singleFile.type || 'application/octet-stream');
          xhr.send(singleFile);
        });
      }

      // 3. Complete batch upload
      setUploadStatusText('Menyimpan metadata dan mengaktifkan link...');
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          blobUrl: uploadedFilesUrls[0]?.blobUrl,
          fileUrls: uploadedFilesUrls,
        }),
      });

      if (!completeRes.ok) {
        throw new Error('Gagal mengaktifkan link file setelah upload.');
      }

      // 4. Save to anonymous upload history in localStorage
      const historyFiles = selectedFiles.map((f) => {
        let cat: FileCategory = 'document';
        if (f.type.startsWith('image/')) cat = 'image';
        else if (f.type.startsWith('video/')) cat = 'video';

        return {
          filename: f.name,
          fileSize: f.size,
          category: cat,
          extension: getFileExtension(f.name),
        };
      });

      saveToHistory({
        id: fileId,
        publicUrl,
        deleteToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        totalSize: totalSelectedSize,
        fileCount: selectedFiles.length,
        files: historyFiles,
      });

      // Dispatch event to update Navbar history count badge immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('droplink_history_updated'));
      }

      setSuccessData({
        fileId,
        publicUrl,
        deleteToken,
        expiresAt,
        totalSize: totalSelectedSize,
        files: historyFiles.map((h) => ({
          filename: h.filename,
          fileSize: h.fileSize,
          category: h.category,
        })),
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setErrorMsg(null);
    setSuccessData(null);
    setUploadProgress(0);
    setUploadStatusText('');
  };

  if (successData) {
    return (
      <SuccessCard
        fileId={successData.fileId}
        publicUrl={successData.publicUrl}
        deleteToken={successData.deleteToken}
        expiresAt={successData.expiresAt}
        totalSize={successData.totalSize}
        files={successData.files}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* 3D Elevated Dropzone Box */}
      <div
        className={`relative bg-white rounded-3xl border-2 transition-all duration-300 p-6 sm:p-8 text-center shadow-[0_20px_50px_rgba(37,99,235,0.1),0_8px_20px_rgba(0,0,0,0.04)] ${
          isDragging
            ? 'border-blue-500 bg-blue-50/40 shadow-[0_25px_60px_rgba(37,99,235,0.22)] scale-[1.01]'
            : 'border-slate-200/90 hover:border-blue-300 hover:shadow-[0_25px_60px_rgba(37,99,235,0.16)]'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onFileInputChange}
          disabled={isUploading}
        />

        {/* Upload Icon & Drop Area Callout */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer group flex flex-col items-center justify-center py-2"
        >
          <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-[0_8px_20px_rgba(37,99,235,0.15)] group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all duration-200 mb-4">
            <UploadCloud className="w-10 h-10 -translate-y-0.5 group-hover:-translate-y-1 transition-transform" />
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-1">
            {selectedFiles.length > 0 ? 'Tambah File Lainnya' : 'Seret & Lepas File di Sini'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-3">
            Bisa pilih <span className="text-blue-600 font-bold">banyak file sekaligus</span> (Foto + Dokumen) dalam 1 link berbagi.
          </p>

          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold shadow-sm group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Pilih File dari Perangkat
          </span>
        </div>

        {/* Selected Files Staging List */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5 text-left">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2.5">
              <span>File Dipilih ({selectedFiles.length}):</span>
              <span className={totalSelectedSize > 50 * 1024 * 1024 ? 'text-red-600 font-extrabold' : 'text-slate-500'}>
                Total: {formatBytes(totalSelectedSize)} / 50 MB
              </span>
            </div>

            <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
              {selectedFiles.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="flex items-center justify-between gap-3 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl px-3 py-2 text-xs transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2 truncate max-w-[75%]">
                    {getCategoryIcon(f)}
                    <span className="font-semibold text-slate-800 truncate" title={f.name}>
                      {f.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {formatBytes(f.size)}
                    </span>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus file ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 text-left bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 shadow-sm animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Retention Selector */}
        <div className="mt-6 border-t border-slate-100 pt-5 text-left">
          <RetentionSelector
            value={retention}
            onChange={(m) => setRetention(m)}
            disabled={isUploading}
          />
        </div>

        {/* Cloudflare Turnstile */}
        <div className="mt-5 flex justify-center">
          <Turnstile
            siteKey={
              process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
            }
            onSuccess={(token) => {
              setTurnstileToken(token);
              setErrorMsg(null);
            }}
            onError={() => {
              setErrorMsg('Verifikasi captcha gagal. Muat ulang halaman.');
            }}
            onExpire={() => {
              setTurnstileToken('');
            }}
          />
        </div>

        {/* Upload Progress Indicator */}
        {isUploading && (
          <div className="mt-5 text-left bg-blue-50/70 border border-blue-100 rounded-2xl p-4 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-2">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>{uploadStatusText || 'Mengunggah file...'}</span>
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 3D Tactile Submit Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleStartUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-150 flex items-center justify-center gap-2 ${
              selectedFiles.length === 0 || isUploading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_4px_0_0_#1e40af,0_10px_20px_rgba(37,99,235,0.35)] hover:shadow-[0_2px_0_0_#1e40af,0_6px_14px_rgba(37,99,235,0.35)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mengunggah...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>
                  {selectedFiles.length > 1
                    ? `Buat 1 Link Berbagi (${selectedFiles.length} File)`
                    : 'Buat Link Berbagi'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
