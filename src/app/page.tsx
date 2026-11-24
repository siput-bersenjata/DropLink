import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import Dropzone from '@/components/home/Dropzone';
import ValueProps from '@/components/home/ValueProps';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Top Navbar matching DropLink mockup */}
      <Navbar />

      {/* Main Hero & Upload Center */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <Hero />
        <Dropzone />
        <ValueProps />
      </main>

      {/* Clean Footer matching DropLink mockup */}
      <Footer />
    </div>
  );
}
