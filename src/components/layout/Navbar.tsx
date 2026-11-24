'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Send, History, Sparkles } from 'lucide-react';
import { getUploadHistory } from '@/lib/storage/history-store';
import HistoryModal from '@/components/history/HistoryModal';

export default function Navbar() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState<number>(0);

  const refreshCount = () => {
    const items = getUploadHistory();
    setHistoryCount(items.length);
  };

  useEffect(() => {
    refreshCount();
    // Listen for custom event when new file is uploaded
    const handleHistoryUpdated = () => refreshCount();
    window.addEventListener('droplink_history_updated', handleHistoryUpdated);
    window.addEventListener('storage', handleHistoryUpdated);

    return () => {
      window.removeEventListener('droplink_history_updated', handleHistoryUpdated);
      window.removeEventListener('storage', handleHistoryUpdated);
    };
  }, []);

  return (
    <>
      <header className="w-full max-w-6xl mx-auto px-4 pt-4 sm:pt-6">
        <nav className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] px-5 sm:px-8 py-3.5 flex items-center justify-between transition-all">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)] group-hover:bg-blue-700 transition-all group-hover:scale-105 active:scale-95">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5 -translate-y-0.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                DropLink
              </span>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase mt-0.5">
                Multi-File Share
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-3 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Beranda
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="#cara-kerja" className="hover:text-blue-600 transition-colors">
              Cara Kerja
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="#faq" className="hover:text-blue-600 transition-colors">
              FAQ
            </Link>
          </div>

          {/* Actions: Riwayat Button & Info */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="relative inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)] transition-all duration-150 active:translate-y-0.5"
            >
              <History className="w-4 h-4 text-blue-600" />
              <span>Riwayat</span>
              {historyCount > 0 && (
                <span className="bg-blue-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                  {historyCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onHistoryChange={refreshCount}
      />
    </>
  );
}
