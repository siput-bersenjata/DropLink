'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, File, AlertCircle, Loader2 } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { validateFile, formatBytes, RetentionMonths } from '@/lib/validation/file-validator';
import RetentionSelector from './RetentionSelector';
import SuccessCard from './SuccessCard';

export default function Dropzone() {
  const [file, setFile] = useState<File | null>(null);
  const [retention, setRetention] = useState<RetentionMonths>(1);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Success state
  const [successData, setSuccessData] = useState<{
    fileId: string;
    publicUrl: string;
    deleteToken: string;
    expiresAt: string;
    category: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectedFile = useCallback((selectedFile: File) => {
    setErrorMsg(null);
    const validation = validateFile({
      filename: selectedFile.name,
      size: selectedFile.size,
      mimeType: selectedFile.type,
    });

    if (!validation.valid) {
      setErrorMsg(validation.error || 'File tidak valid.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }, []);

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
        handleSelectedFile(e.dataTransfer.files[0]);
      }
    },
    [handleSelectedFile]
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const handleStartUpload = async () => {
    if (!file) return;

    if (!turnstileToken) {
      setErrorMsg('Harap selesaikan verifikasi captcha di bawah sebelum upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg(null);

    try {
      // Gather client-side hints
      const screenResolution =
        typeof window !== 'undefined'
          ? `${window.screen.width}x${window.screen.height}`
          : 'Unknown';
      const timezone =
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : 'UTC';

      // 1. Request presigned URL from Vercel API
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
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

      const { fileId, presignedUrl, deleteToken, publicUrl, expiresAt, category } =
        await presignRes.json();

      // 2. Direct PUT upload to Cloudflare R2 via XMLHttpRequest to track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(
              new Error(`Upload langsung ke storage gagal (Status: ${xhr.status}).`)
            );
          }
        };

        xhr.onerror = () => {
          reject(new Error('Koneksi jaringan terputus saat mengunggah file.'));
        };

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      // 3. Mark file upload complete in API
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (!completeRes.ok) {
        throw new Error('Gagal mengaktifkan file setelah upload.');
      }

      // 4. Save delete token in localStorage for owner convenience
      try {
        const ownerKeys = JSON.parse(localStorage.getItem('droplink_owner_keys') || '{}');
        ownerKeys[fileId] = deleteToken;
        localStorage.setItem('droplink_owner_keys', JSON.stringify(ownerKeys));
      } catch {
        // Safe to ignore localStorage error
      }

      setSuccessData({
        fileId,
        publicUrl,
        deleteToken,
        expiresAt,
        category,
      });
    } catch (err: any) {
      console.error('Upload flow error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSuccessData(null);
    setErrorMsg(null);
    setUploadProgress(0);
    setTurnstileToken('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // If upload succeeded, render SuccessCard
  if (successData && file) {
    return (
      <SuccessCard
        filename={file.name}
        fileSize={file.size}
        category={successData.category}
        fileId={successData.fileId}
        publicUrl={successData.publicUrl}
        deleteToken={successData.deleteToken}
        expiresAt={successData.expiresAt}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Dropzone Container - Styled after DropLink Mockup */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-full rounded-[28px] border-2 border-dashed transition-all p-8 sm:p-12 text-center bg-white shadow-sm relative ${
          isDragging
            ? 'border-blue-600 bg-blue-50/60 scale-[1.01]'
            : 'border-blue-400/80 hover:border-blue-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileInputChange}
          disabled={isUploading}
        />

        {/* Cloud Upload Icon */}
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
          <UploadCloud className="w-7 h-7 stroke-[2.2]" />
        </div>

        {/* Main Headline Inside Box */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          {file ? 'File Dipilih' : 'Seret file ke sini'}
        </h2>

        {/* Separator */}
        <p className="text-xs sm:text-sm font-medium text-slate-400 my-2">atau</p>

        {/* Primary Action Button */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm sm:text-base px-8 py-3 rounded-full shadow-sm shadow-blue-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          {file ? 'Ganti File Lain' : 'Klik untuk Upload File'}
        </button>

        {/* File Preview Card Inside Dropzone if file chosen */}
        {file && !isUploading && (
          <div className="mt-6 p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-left flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center border border-blue-200/60 flex-shrink-0">
                <File className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-red-600 font-semibold hover:underline flex-shrink-0 ml-2"
            >
              Batal
            </button>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengunggah ke Cloudflare R2...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Caption Below Box Matching Mockup */}
      <p className="text-xs text-slate-500 text-center font-medium mt-3.5">
        Mendukung PDF, Gambar, Dokumen, Video — Gambar maks 20MB, Video/Dokumen maks 50MB • Gratis & Tanpa Akun
      </p>

      {/* Retention Selector & Turnstile Form when file is selected */}
      {file && !isUploading && (
        <div className="mt-6 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
          <RetentionSelector value={retention} onChange={setRetention} />

          {/* Cloudflare Turnstile Captcha Widget */}
          <div className="my-5 flex flex-col items-center justify-center min-h-[70px]">
            <p className="text-xs font-semibold text-slate-600 mb-2">Verifikasi Keamanan (Anti-Bot):</p>
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setErrorMsg('Gagal memuat captcha. Periksa koneksi internet Anda.')}
              onExpire={() => setTurnstileToken('')}
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleStartUpload}
            className="w-full max-w-md mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-base py-3.5 px-6 rounded-2xl shadow-md shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            Simpan & Dapatkan Link
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
