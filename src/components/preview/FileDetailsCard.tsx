'use client';

import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, Clock, Trash2, Shield, Calendar } from 'lucide-react';
import { formatBytes } from '@/lib/validation/file-validator';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface FileDetailsCardProps {
  id: string;
  filename: string;
  fileSize: number;
  category: 'image' | 'video' | 'document';
  downloadUrl: string;
  expiresAt: string | Date;
  createdAt: string | Date;
  onDeleted: () => void;
}

export default function FileDetailsCard({
  id,
  filename,
  fileSize,
  category,
  downloadUrl,
  expiresAt,
  createdAt,
  onDeleted,
}: FileDetailsCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [savedOwnerToken, setSavedOwnerToken] = useState<string>('');

  useEffect(() => {
    try {
      const keys = JSON.parse(localStorage.getItem('droplink_owner_keys') || '{}');
      if (keys[id]) {
        setSavedOwnerToken(keys[id]);
      }
    } catch {
      // Ignore localStorage error
    }
  }, [id]);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Calculate remaining days
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const expiryString = expiryDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 mt-6 text-left">
      {/* File Title & Basic Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate" title={filename}>
            {filename}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700">{formatBytes(fileSize)}</span>
            <span>•</span>
            <span className="capitalize font-medium">{category}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              Diunggah {new Date(createdAt).toLocaleDateString('id-ID')}
            </span>
          </p>
        </div>

        {/* Expiration badge */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold w-fit">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>{diffDays > 0 ? `${diffDays} hari lagi` : 'Segera kedaluwarsa'}</span>
        </div>
      </div>

      {/* Expiry Details */}
      <div className="py-4 text-xs text-slate-600 flex items-center gap-2 border-b border-slate-100">
        <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>
          File ini disimpan secara aman dan akan dihapus otomatis dari server pada tanggal <b>{expiryString}</b>.
        </span>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Download Button */}
          <a
            href={downloadUrl}
            download={filename}
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm sm:text-base px-8 py-3 rounded-full shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Download className="w-5 h-5 stroke-[2.2]" />
            <span>Download File</span>
          </a>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={copyShareLink}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-5 py-3 rounded-full flex items-center justify-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
          </button>
        </div>

        {/* Owner Delete Button */}
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 hover:underline py-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Hapus File</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        fileId={id}
        defaultToken={savedOwnerToken}
        onSuccess={onDeleted}
      />
    </div>
  );
}
