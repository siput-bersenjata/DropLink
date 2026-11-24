import React from 'react';

export default function Hero() {
  return (
    <section className="text-center pt-10 sm:pt-14 pb-6 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
        Bagikan File dengan Link.
        <br />
        <span className="text-slate-900">Cepat. Aman. Gratis.</span>
      </h1>
      <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
        Seret & lepas file kamu di sini. Tidak perlu daftar. Link otomatis dibuat.
      </p>
    </section>
  );
}
