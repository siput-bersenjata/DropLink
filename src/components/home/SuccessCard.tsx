'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, ExternalLink, Trash2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { formatBytes } from '@/lib/validation/file-validator';

interface SuccessCardProps {
  filename: string;
  fileSize: number;
  category: string;
  fileId: string;
  publicUrl: string;
  deleteToken: string;
  expiresAt: string | Date;
  onReset: () => void;
}

export default function SuccessCard({
  filename,
  fileSize,
  category,
  fileId,
  publicUrl,
  deleteToken,
  expiresAt,
  onReset,
}: SuccessCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const fullShareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${publicUrl}`
      : `https://drop-link.vercel.app${publicUrl}`;

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

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-left animate-in fade-in zoom-in-95 duration-200">
      {/* Success Badge */}
      <div className="flex items-center gap-2.5 text-emerald-600 bg-emerald-50 border border-emerald-200/70 px-4 py-2 rounded-2xl w-fit mb-5">
        <ShieldCheck className="w-5 h-5" />
        <span className="text-xs sm:text-sm font-bold">File Berhasil Diunggah & Link Siap!</span>
      </div>

      {/* File Info */}
      <div className="border-b border-slate-100 pb-4 mb-5">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate" title={filename}>
          {filename}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {formatBytes(fileSize)} • Kategori: <span className="capitalize font-medium">{category}</span> • Berlaku hingga: <span className="font-semibold text-slate-700">{expiryFormatted}</span>
        </p>
      </div>

      {/* Share Link Input Box */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Tautan Berbagi (Siap Dikirim):
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
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4" />
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

      {/* Delete Key Warning & Option */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 mb-5 text-xs text-amber-900">
        <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-800">
          <Trash2 className="w-4 h-4" />
          <span>Kunci Hapus Pengunggah (Delete Key):</span>
        </div>
        <p className="text-amber-800/90 leading-relaxed mb-2.5">
          Simpan kunci ini jika Anda ingin menghapus file ini lebih awal sebelum masa aktif habis:
        </p>
        <div className="flex items-center gap-2">
          <code className="bg-white/80 border border-amber-200 px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-800 truncate flex-1">
            {deleteToken}
          </code>
          <button
            type="button"
            onClick={copyToken}
            className="bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
          >
            {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedToken ? 'Tersalin' : 'Salin Kunci'}</span>
          </button>
        </div>
      </div>

      {/* QR Code toggle */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="text-xs text-blue-600 font-semibold hover:underline"
        >
          {showQr ? 'Sembunyikan QR Code' : 'Tampilkan QR Code untuk Scan di HP'}
        </button>
        {showQr && (
          <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center">
            <QRCodeSVG value={fullShareUrl} size={150} />
            <p className="text-[11px] text-slate-500 mt-2">Scan dengan kamera smartphone untuk membuka link</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onReset}
          className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload File Lain</span>
        </button>

        <Link
          href={publicUrl}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
        >
          <span>Buka Halaman Preview</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
