'use client';

import React from 'react';
import { FileText, FileArchive, Film, Image as ImageIcon } from 'lucide-react';

interface MediaViewerProps {
  filename: string;
  category: 'image' | 'video' | 'document';
  downloadUrl: string;
  mimeType: string;
}

export default function MediaViewer({
  filename,
  category,
  downloadUrl,
  mimeType,
}: MediaViewerProps) {
  if (category === 'image') {
    return (
      <div className="w-full bg-slate-100/80 rounded-2xl overflow-hidden border border-slate-200/80 flex items-center justify-center p-4 min-h-[250px] max-h-[500px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={downloadUrl}
          alt={filename}
          className="max-h-[460px] w-auto max-w-full rounded-xl object-contain shadow-sm"
          loading="lazy"
        />
      </div>
    );
  }

  if (category === 'video') {
    return (
      <div className="w-full bg-black rounded-2xl overflow-hidden shadow-sm">
        <video
          controls
          playsInline
          className="w-full max-h-[460px] object-contain mx-auto"
          preload="metadata"
        >
          <source src={downloadUrl} type={mimeType || 'video/mp4'} />
          Browser Anda tidak mendukung pemutar video HTML5.
        </video>
      </div>
    );
  }

  // Document fallback
  const isArchive = filename.endsWith('.zip') || filename.endsWith('.rar') || filename.endsWith('.7z');
  const Icon = isArchive ? FileArchive : FileText;

  return (
    <div className="w-full bg-slate-50/80 rounded-2xl border border-slate-200/80 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-8 h-8 stroke-[2]" />
      </div>
      <h4 className="text-lg font-bold text-slate-800 max-w-md truncate" title={filename}>
        {filename}
      </h4>
      <p className="text-xs text-slate-500 mt-1">
        Pratinjau langsung tidak tersedia untuk format ini. Silakan unduh file untuk membukanya.
      </p>
    </div>
  );
}
