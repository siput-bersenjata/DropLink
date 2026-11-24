'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, RefreshCw, X } from 'lucide-react';

interface BotBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  isRateLimit?: boolean;
}

export default function BotBlockedModal({
  isOpen,
  onClose,
  message,
  isRateLimit,
}: BotBlockedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-red-200 shadow-[0_25px_60px_-15px_rgba(220,38,38,0.25)] p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
      >
        {/* Shield Icon with 3D Pulse */}
        <div className="w-16 h-16 rounded-3xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-[0_8px_20px_rgba(220,38,38,0.2)]">
          <ShieldAlert className="w-9 h-9 stroke-[2.2]" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          {isRateLimit ? 'Batas Upload Tercapai' : 'Akses Ditolak: Terdeteksi Bot'}
        </h3>

        {/* Message */}
        <div className="bg-red-50/80 border border-red-100 rounded-2xl p-4 mb-5 text-left text-xs sm:text-sm text-red-800 leading-relaxed">
          <div className="flex items-start gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="font-bold">Keamanan Sistem Aktif:</span>
          </div>
          <p className="text-xs text-red-700/90 pl-6">
            {message ||
              'Sistem keamanan mendeteksi aktivitas mencurigakan atau script otomatis dari perangkat Anda. Permintaan unggah dibatalkan untuk melindungi server.'}
          </p>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Jika Anda adalah pengguna manusia asli, pastikan tidak menggunakan ekstensi otomatisasi peramban dan coba muat ulang halaman.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-[0_4px_0_0_#991b1b,0_8px_16px_rgba(220,38,38,0.3)] hover:shadow-[0_2px_0_0_#991b1b] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang Halaman</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
