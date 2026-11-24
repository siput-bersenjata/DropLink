'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  defaultToken?: string;
  onSuccess: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  fileId,
  defaultToken = '',
  onSuccess,
}: DeleteConfirmationModalProps) {
  const [tokenInput, setTokenInput] = useState(defaultToken);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg('Masukkan Delete Token rahasia Anda.');
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/file/${fileId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteToken: tokenInput.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus file.');
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menghapus.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200 text-left relative animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus File Sekarang?</h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          File akan dihapus secara permanen dari penyimpanan cloud dan link ini tidak akan bisa dibuka lagi.
        </p>

        <form onSubmit={handleDelete}>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Masukkan Kunci Hapus (Delete Key):
          </label>
          <input
            type="text"
            required
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Kunci rahasia dari pengunggah..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 mb-3"
          />

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Hapus Permanen</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
