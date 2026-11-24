import React from 'react';
import { Shield, Clock, Link2 } from 'lucide-react';

export default function ValueProps() {
  const items = [
    {
      icon: Shield,
      title: 'Sederhana',
      description: 'Cukup seret, dapatkan link, selesai.',
    },
    {
      icon: Clock,
      title: 'Tanpa Akun',
      description: 'Tidak perlu login atau registrasi.',
    },
    {
      icon: Link2,
      title: 'Link Instan',
      description: 'Link langsung siap dibagikan.',
    },
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-4 transition-transform hover:-translate-y-1 duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100/90 text-blue-600 flex items-center justify-center mb-3.5 shadow-sm">
                <Icon className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 leading-normal">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
