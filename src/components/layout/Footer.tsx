import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-8 px-4 text-center border-t border-slate-200/60 bg-white/40">
      <div className="max-w-4xl mx-auto space-y-2.5">
        <div className="text-xs sm:text-sm text-slate-500 font-medium space-y-1 sm:space-y-0 sm:flex sm:items-center sm:justify-center sm:gap-2 flex-wrap">
          <span>Privasi terjaga</span>
          <span className="hidden sm:inline">•</span>
          <span>File terhapus otomatis setelah 1-6 bulan</span>
          <span className="hidden sm:inline">•</span>
          <span>© 2026 DropLink</span>
          <span className="hidden sm:inline">•</span>
          <a
            href="#kebijakan"
            className="hover:text-blue-600 transition-colors underline-offset-4 hover:underline"
          >
            Kebijakan Privasi
          </a>
        </div>

        {/* Credit: Support by Cartenz & build with love Salshya */}
        <div className="pt-1 flex items-center justify-center">
          <a
            href="https://salshya-club.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100/80 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-all text-xs font-medium border border-slate-200/80 hover:border-blue-200 shadow-sm hover:shadow active:scale-95"
            title="Salshya_Club | Pusat Software Premium, Produk Digital & Layanan Sosmed"
          >
            <span>Support by <b className="text-slate-800 group-hover:text-blue-700">Cartenz</b></span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1">
              Build with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> <b className="text-slate-800 group-hover:text-blue-700">Salshya</b>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
