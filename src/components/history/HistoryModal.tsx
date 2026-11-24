'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  History,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  getUploadHistory,
  removeFromHistory,
  clearUploadHistory,
  isItemExpired,
  getDaysRemaining,
  HistoryItem,
} from '@/lib/storage/history-store';
import { formatBytes } from '@/lib/validation/file-validator';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHistoryChange?: () => void;
}

export default function HistoryModal({
  isOpen,
  onClose,
  onHistoryChange,
}: HistoryModalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = () => {
    setHistory(getUploadHistory());
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async (item: HistoryItem) => {
    try {
      const fullUrl = `${window.location.origin}${item.publicUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDeleteItem = async (item: HistoryItem) => {
    const expired = isItemExpired(item);
    if (!expired && item.deleteToken) {
      const confirmDelete = window.confirm(
        'Apakah Anda yakin ingin menghapus file ini sekarang dari server?'
      );
      if (!confirmDelete) return;

      try {
        setDeletingId(item.id);
        await fetch(`/api/file/${item.id}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deleteToken: item.deleteToken }),
        });
      } catch (err) {
        console.error('Failed to delete file from server:', err);
      } finally {
        setDeletingId(null);
      }
    }

    removeFromHistory(item.id);
    loadHistory();
    onHistoryChange?.();
  };

  const handleClearAll = () => {
    if (window.confirm('Bersihkan semua riwayat dari browser ini? (File di cloud tetap aktif hingga masa retensi habis)')) {
      clearUploadHistory();
      loadHistory();
      onHistoryChange?.();
    }
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl border border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Riwayat Unggahan Kamu
              </h2>
              <p className="text-xs text-slate-500">
                Tersimpan di browser ini tanpa perlu login (anonim)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shadow-sm"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {history.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <File className="w-8 h-8" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-700 mb-1">
                Belum Ada Riwayat File
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                File yang kamu upload di situs ini akan otomatis tercatat di sini sehingga kamu tidak akan kehilangan link jika tidak sengaja me-refresh halaman.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const expired = isItemExpired(item);
              const daysLeft = getDaysRemaining(item.expiresAt);
              const expiryDateString = new Date(item.expiresAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const uploadDateString = new Date(item.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
                    expired
                      ? 'bg-slate-50/80 border-slate-200/90 opacity-80'
                      : 'bg-white border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)] hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top Bar: Status and Expiry */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {expired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Kedaluwarsa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Clock className="w-3.5 h-3.5" />
                          Aktif • {daysLeft} hari lagi
                        </span>
                      )}
                      <span className="text-[11px] text-slate-600">
                        {expired ? `Habis pada ${expiryDateString}` : `s/d ${expiryDateString}`}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-600 font-medium">
                      Diunggah: {uploadDateString}
                    </span>
                  </div>

                  {/* Files List / Preview */}
                  <div className="space-y-1.5 mb-3 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                    {expired ? (
                      // If expired: show filename and extension ONLY, as requested
                      <div className="space-y-1">
                        {item.files.map((f, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs text-slate-600"
                          >
                            <span className="font-semibold text-slate-700 truncate max-w-[80%]">
                              {f.filename}
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                              .{f.extension || 'file'}
                            </span>
                          </div>
                        ))}
                        <p className="text-[11px] text-amber-700/90 pt-1 italic">
                          File telah otomatis terhapus dari server cloud sesuai batas retensi.
                        </p>
                      </div>
                    ) : (
                      // If active: full details
                      item.files.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-slate-700"
                        >
                          <div className="flex items-center gap-2 truncate max-w-[75%]">
                            {getFileIcon(f.category)}
                            <span className="font-medium text-slate-800 truncate" title={f.filename}>
                              {f.filename}
                            </span>
                          </div>
                          <span className="text-slate-600 text-[11px] font-mono">
                            {formatBytes(f.fileSize)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="text-[11px] text-slate-600 font-medium">
                      Total: <span className="font-semibold text-slate-700">{formatBytes(item.totalSize)}</span> ({item.files.length} file)
                    </div>

                    <div className="flex items-center gap-2">
                      {!expired && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-all active:scale-95 shadow-sm"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>

                          <Link
                            href={item.publicUrl}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all"
                          >
                            <span>Buka</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title={expired ? 'Hapus dari daftar riwayat' : 'Hapus file sekarang'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Total riwayat: <b>{history.length} tautan</b>
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-700 font-semibold hover:underline"
            >
              Bersihkan Semua Riwayat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
