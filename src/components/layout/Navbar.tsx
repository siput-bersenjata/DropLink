import React from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="w-full max-w-6xl mx-auto px-4 pt-4 sm:pt-6">
      <nav className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 sm:px-8 py-3.5 flex items-center justify-between transition-all">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <Send className="w-5 h-5 -rotate-12 translate-x-0.5 -translate-y-0.5" />
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            DropLink
          </span>
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
          <span className="text-slate-300">•</span>
          <Link href="#tentang" className="hover:text-blue-600 transition-colors">
            Tentang
          </Link>
        </div>

        {/* Right CTA */}
        <div>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded-full shadow-sm shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Masuk
          </button>
        </div>
      </nav>
    </header>
  );
}
