# ✈ DropLink — Bagikan File dengan Link. Cepat. Aman. Gratis.

DropLink adalah aplikasi web berbagi file sementara (*temporary file drop*) 100% anonim tanpa perlu registrasi atau login. Dibangun dengan performa tinggi menggunakan arsitektur **Direct-to-R2 Upload**, sehingga browser mengunggah file langsung ke **Cloudflare R2** (10 GB gratis, 0 biaya egress) tanpa membebani server Vercel.

---

## ✨ Fitur Utama

- **Akses Anonim (Zero-Login)**: Siapa pun bisa langsung *drag-and-drop* file untuk mendapatkan tautan instan.
- **Batas Ukuran File yang Ketat**:
  - 📷 **Gambar**: Maksimal **20 MB** (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`).
  - 🎥 **Video**: Maksimal **50 MB** (`.mp4`, `.webm`, `.mov`, `.mkv`).
  - 📄 **Dokumen & Arsip**: Maksimal **50 MB** (`.pdf`, `.docx`, `.xlsx`, `.pptx`, `.txt`, `.zip`, `.rar`, `.7z`).
  - 🛡 **Keamanan Mutlak**: File executable berbahaya (`.exe`, `.bat`, `.sh`, `.php`, dll.) diblokir secara total.
- **Masa Simpan Fleksibel (1–6 Bulan)**: Pengunggah dapat memilih durasi aktif file:
  - `1 Bulan` (30 hari)
  - `3 Bulan` (90 hari)
  - `6 Bulan` (180 hari)
- **Anti-Bot & Verifikasi Captcha**: Terproteksi **Cloudflare Turnstile** sebelum proses simpan dimulai untuk mencegah bot flood.
- **Perekaman Audit Log Perangkat & IP**: Mencatat IP address publik, negara, kota, browser, OS, tipe perangkat (*mobile/desktop/tablet*), dan resolusi layar setiap kali file diunggah.
- **Pencegahan Spam / Rate Limiting**: Batasan maksimal 10 upload per jam per IP address untuk menjaga kuota 10 GB tetap awet.
- **Kunci Hapus Pengunggah (Delete Key)**: Pengunggah mendapatkan token rahasia untuk menghapus file secara instan kapan saja.
- **Halaman Pratinjau Interaktif (`/f/[id]`)**:
  - Pemutar video HTML5 responsif.
  - Penampil gambar resolusi tinggi.
  - Kartu detail dokumen lengkap dengan hitung mundur masa aktif (*countdown timer*).
  - Tombol 1-klik unduh & salin link.
- **Pembersihan Otomatis (Dual-Layer Cleanup)**:
  - *On-access check*: Menolak akses dan menghapus file dari R2 jika masa berlaku sudah lewat saat dibuka.
  - *Vercel Cron Job*: Pembersihan harian otomatis pada pukul 00:00 UTC.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS & Lucide React
- **Storage**: Cloudflare R2 via `@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`
- **Captcha**: Cloudflare Turnstile (`@marsidev/react-turnstile`)
- **Audit Logging**: `ua-parser-js`
- **QR Code**: `qrcode.react`
- **Testing**: Vitest (100% Test Coverage untuk file validator, audit logger, storage client, security, dan API routes)
- **Target Deployment**: Vercel (`drop-link`) + GitHub

---

## 🚀 Panduan Setup & Menjalankan Lokal

### 1. Kloning & Install Dependensi
```bash
git clone <url-repo-github-anda>
cd "Drop Link"
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Isi variabel berikut:
* `R2_ACCOUNT_ID`: Account ID dari Cloudflare Dashboard.
* `R2_ACCESS_KEY_ID`: Access Key ID dari Cloudflare R2 API Tokens.
* `R2_SECRET_ACCESS_KEY`: Secret Access Key dari Cloudflare R2.
* `R2_BUCKET_NAME`: Nama bucket R2 Anda (contoh: `drop-link-storage`).
* `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Site key widget Cloudflare Turnstile.
* `TURNSTILE_SECRET_KEY`: Secret key Cloudflare Turnstile.
* `CRON_SECRET`: Token rahasia acak untuk endpoint cleanup Vercel Cron.

*(Catatan: Tanpa variabel di atas, aplikasi secara otomatis berjalan dalam **Mode Mock / Testing** untuk memudahkan pengujian lokal)*.

### 3. Menjalankan Tes Otomatis
```bash
npm test
```

### 4. Menjalankan Development Server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## ☁️ Panduan Deploy ke Vercel & Push ke GitHub

### Langkah 1: Push ke GitHub Anda
1. Buat repositori baru di GitHub Anda dengan nama `drop-link`.
2. Di terminal folder proyek ini, jalankan:
   ```bash
   git remote add origin https://github.com/<username-anda>/drop-link.git
   git branch -M main
   git push -u origin main
   ```

### Langkah 2: Deploy di Vercel
1. Buka [vercel.com](https://vercel.com) dan login dengan akun Vercel Anda.
2. Klik tombol **"Add New..."** -> **"Project"**.
3. Pilih repositori GitHub `drop-link` yang baru saja Anda push.
4. Pada bagian **Environment Variables**, tambahkan variabel yang ada di file `.env.example`:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `CRON_SECRET`
5. Klik **"Deploy"**. Vercel akan mem-build proyek secara otomatis dan aplikasi Anda akan langsung aktif dengan nama domain `drop-link.vercel.app`!
