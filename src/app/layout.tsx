import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DropLink — Bagikan File dengan Link. Cepat. Aman. Gratis.',
  description: 'Seret & lepas file kamu di sini. Tidak perlu daftar. Link otomatis dibuat.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
