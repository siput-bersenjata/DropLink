import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-8 px-4 text-center border-t border-slate-200/60 bg-white/40">
      <div className="max-w-4xl mx-auto text-xs sm:text-sm text-slate-500 font-medium space-y-1 sm:space-y-0 sm:flex sm:items-center sm:justify-center sm:gap-2">
        <span>Privasi terjaga</span>
        <span className="hidden sm:inline">•</span>
        <span>File terhapus otomatis setelah 1-6 bulan</span>
        <span className="hidden sm:inline">•</span>
        <span>© 2024 DropLink</span>
        <span className="hidden sm:inline">•</span>
        <a href="#kebijakan" className="hover:text-blue-600 transition-colors underline-offset-4 hover:underline">
          Kebijakan Privasi
        </a>
      </div>
    </footer>
  );
}
