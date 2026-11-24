'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Video,
  KeyRound,
  QrCode,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { formatBytes, FileCategory } from '@/lib/validation/file-validator';

export interface SuccessUploadedFile {
  filename: string;
  fileSize: number;
  category: FileCategory;
}

interface SuccessCardProps {
  fileId: string;
  publicUrl: string;
  deleteToken: string;
  expiresAt: string | Date;
  totalSize: number;
  files: SuccessUploadedFile[];
  onReset: () => void;
}

export default function SuccessCard({
  fileId,
  publicUrl,
  deleteToken,
  expiresAt,
  totalSize,
  files,
  onReset,
}: SuccessCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const fullShareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${publicUrl}`
      : `https://drop-link-three.vercel.app${publicUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(deleteToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    } catch {
      // Fallback
    }
  };

  const expiryFormatted = new Date(expiresAt).toLocaleDateString('id-ID', {
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

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-blue-100 shadow-[0_20px_50px_rgba(37,99,235,0.12),0_8px_20px_rgba(0,0,0,0.04)] p-6 sm:p-8 text-left animate-in fade-in zoom-in-95 duration-200">
      {/* Success Badge */}
      <div className="flex items-center gap-2.5 text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-4 py-2 rounded-2xl w-fit mb-5 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <span className="text-xs sm:text-sm font-extrabold tracking-tight">
          {files.length > 1
            ? `${files.length} File Berhasil Diunggah (1 Link Siap)!`
            : 'File Berhasil Diunggah & Link Siap!'}
        </span>
      </div>

      {/* Files Overview */}
      <div className="border border-slate-100 bg-slate-50/70 rounded-2xl p-4 mb-5 shadow-inner">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2.5 pb-2 border-b border-slate-200/60">
          <span>Daftar File ({files.length})</span>
          <span>Total: {formatBytes(totalSize)}</span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center gap-2 truncate max-w-[75%]">
                {getFileIcon(f.category)}
                <span className="font-bold text-slate-800 truncate" title={f.filename}>
                  {f.filename}
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[11px] flex-shrink-0">
                {formatBytes(f.fileSize)}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-2.5 text-right">
          Masa aktif hingga: <span className="font-bold text-slate-700">{expiryFormatted}</span>
        </p>
      </div>

      {/* Share Link Input Box */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Tautan Berbagi Satu Link (Siap Dikirim):
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={fullShareUrl}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-mono select-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={copyLink}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-[0_3px_0_0_#1d4ed8,0_6px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_1px_0_0_#1d4ed8] hover:translate-y-0.5 active:translate-y-1 active:shadow-none flex items-center gap-1.5 transition-all"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Delete Token Box */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
          <KeyRound className="w-4 h-4 text-amber-700" />
          <span>Kunci Hapus Pengunggah (Delete Key):</span>
        </div>
        <p className="text-[11px] text-amber-800/80 mb-2 leading-relaxed">
          Otomatis tersimpan di menu <b>Riwayat</b> browser ini. Simpan juga kunci ini jika ingin menghapus file lebih awal dari perangkat lain:
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={deleteToken}
            className="w-full bg-white border border-amber-200 rounded-xl px-3 py-1.5 text-xs text-amber-900 font-mono select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={copyToken}
            className="flex-shrink-0 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1"
          >
            {copiedToken ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Disalin</span>
              </>
            ) : (
              <span>Salin Kunci</span>
            )}
          </button>
        </div>
      </div>

      {/* QR Code toggle */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1.5 hover:underline"
        >
          <QrCode className="w-4 h-4" />
          <span>{showQr ? 'Sembunyikan QR Code' : 'Tampilkan QR Code untuk Scan di HP'}</span>
        </button>

        {showQr && (
          <div className="mt-3 p-4 bg-white border border-slate-200 rounded-2xl w-fit mx-auto shadow-md animate-in fade-in zoom-in-95">
            <QRCodeSVG value={fullShareUrl} size={150} />
            <p className="text-[10px] text-center text-slate-500 mt-2">
              Scan dengan kamera HP untuk mengunduh
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload File Lain</span>
        </button>

        <Link
          href={publicUrl}
          className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all hover:scale-[1.02] active:scale-95 inline-flex items-center justify-center gap-1.5"
        >
          <span>Buka Halaman Preview</span>
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
