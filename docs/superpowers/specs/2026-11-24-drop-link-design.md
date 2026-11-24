# Drop Link - Design Specification
**Date:** 2026-11-24  
**Project:** Drop Link  
**Target Deployment:** Vercel (`drop-link`) + GitHub  
**Storage Provider:** Cloudflare R2 (10 GB Free Tier, Zero Egress Fees)  
**Security & Anti-Bot:** Cloudflare Turnstile + IP Rate Limiting + Device & IP Audit Logging  

---

## 1. Overview & Objectives

**Drop Link** adalah aplikasi web berbagi file sementara (*temporary file sharing*) tanpa perlu login/registrasi (100% anonim). Pengguna dapat langsung menjatuhkan (*drag-and-drop*) file untuk mendapatkan tautan publik yang dapat dibagikan, dengan masa aktif file antara 1 hingga 6 bulan.

### 1.1 Persyaratan Utama
*   **Akses Pengguna:** Anonim (tanpa login).
*   **Batasan Ukuran File:**
    *   **Gambar:** Maksimal **20 MB** (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`).
    *   **Video:** Maksimal **50 MB** (`.mp4`, `.webm`, `.mov`, `.mkv`).
    *   **Dokumen & Arsip:** Maksimal **50 MB** (`.pdf`, `.docx`, `.xlsx`, `.pptx`, `.txt`, `.zip`, `.rar`, `.7z`).
    *   **Batas Absolut:** Tidak ada file yang melebihi **50 MB**. File yang dapat dieksekusi atau berpotensi bahaya (`.exe`, `.bat`, `.sh`, `.php`, dll.) diblokir secara mutlak.
*   **Masa Simpan (Retention Period):** Pengguna memilih opsi masa simpan sebelum upload:
    *   `1 Bulan` (30 hari)
    *   `3 Bulan` (90 hari)
    *   `6 Bulan` (180 hari)
*   **Penyimpanan Cloud:** Cloudflare R2 (10 GB kuota gratis, gratis biaya bandwidth keluar/egress).
*   **Hosting Aplikasi:** Vercel (nama proyek: `drop-link`), source code di-push ke GitHub pengguna.
*   **Pengalaman Penerima:** Halaman preview interaktif (media player untuk video, image lightbox untuk gambar, info dokumen dan countdown kadaluarsa, serta tombol Download).
*   **Kontrol Pengunggah:** Diberikan *Delete Key / Link* agar pengunggah dapat menghapus file sebelum masa kadaluarsa jika diinginkan.
*   **Desain Antarmuka:** Pengguna akan mengirimkan desain spesifik nanti; arsitektur kode frontend disiapkan modular (*slot-based*) menggunakan Next.js + Tailwind CSS.

---

## 2. Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────┐
│                    Browser (Pengguna)                        │
└───────┬──────────────────────────────────────────────▲───────┘
        │                                              │
        │ 1. Request Presign + Device Info + Turnstile │
        ▼                                              │ 3. Direct Upload
┌──────────────────────────────────────┐               │    (PUT S3 API)
│ Vercel Serverless API (Next.js)      │               │
│ - Validasi Turnstile Token           │               │
│ - Rate Limiting & Filter File        │               │
│ - Rekam Audit Log (IP & Device)      │               │
│ - Generate S3 Presigned URL          │               │
└───────┬──────────────────────────────┘               │
        │ 2. Return Presigned URL                      │
        ▼                                              │
┌──────────────────────────────────────┐               │
│ Serverless Database (Neon / Turso)   │               │
│ - Simpan Metadata File               │               │
│ - Simpan Log Perangkat & IP          │               │
└──────────────────────────────────────┘               │
                                                       ▼
┌──────────────────────────────────────────────────────────────┐
│ Cloudflare R2 Storage (10 GB Free Tier, S3 Compatible)        │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 Alur Unggah (Direct-to-R2 Upload Pattern)
1.  Pengguna memilih file di browser, memilih masa aktif (1, 3, atau 6 bulan).
2.  Browser memvalidasi ekstensi dan batas ukuran file (client-side check).
3.  Widget **Cloudflare Turnstile** muncul dan memvalidasi interaksi pengguna.
4.  Browser mengumpulkan informasi perangkat client-side (layar, timezone, platform) lalu mengirim request `POST /api/upload/presign` beserta token Turnstile ke Vercel.
5.  Vercel API:
    *   Memverifikasi token Turnstile ke API Cloudflare.
    *   Mengekstrak IP publik dari header `x-forwarded-for` dan memverifikasi batas rate-limit (maks 10 upload/jam/IP).
    *   Mem-parsing user agent (Browser, OS, Tipe Perangkat).
    *   Menghasilkan ID unik pendek (nanoid: misal `7k9xQ2mP`) dan *Delete Token* rahasia.
    *   Membuat *S3 Presigned PUT URL* sementara (berlaku 10 menit) yang mengarah langsung ke bucket Cloudflare R2.
    *   Menyimpan data awal file (status: `pending`) dan audit log ke database.
    *   Mengembalikan `presignedUrl`, `fileId`, `deleteToken`, dan `publicUrl` ke browser.
6.  Browser mengunggah file langsung ke Cloudflare R2 menggunakan `fetch(presignedUrl, { method: 'PUT', body: file })` dengan menampilkan *real-time progress bar*.
7.  Setelah upload sukses, browser memanggil `POST /api/upload/complete` untuk mengubah status file menjadi `active`.
8.  Browser menampilkan link yang siap dibagikan serta tombol salin *Delete Key*.

---

## 3. Keamanan, Anti-Bot & Perekaman Data Perangkat

### 3.1 Cloudflare Turnstile Integration
*   Endpoint verifikasi: `https://challenges.cloudflare.com/turnstile/v0/siteverify`
*   Secret Key disimpan di Vercel Environment Variables (`TURNSTILE_SECRET_KEY`).
*   Public Site Key dipasang di Frontend (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
*   Jika token tidak valid, response: `403 Forbidden` ("Verifikasi captcha gagal").

### 3.2 Perekaman Data Perangkat (Audit Logging)
Data yang direkam pada saat upload dan disimpan di tabel `upload_audit_logs`:
*   `ip_address`: String IP address pengunggah (dari header Vercel `x-forwarded-for`).
*   `country`: Kode negara 2 huruf (dari header Vercel `x-vercel-ip-country`).
*   `city`: Nama kota (dari header Vercel `x-vercel-ip-city`).
*   `user_agent`: String User-Agent lengkap.
*   `browser_name` & `browser_version`: Hasil parsing library `ua-parser-js` (contoh: *Chrome 122.0.0*).
*   `os_name` & `os_version`: Hasil parsing (contoh: *Windows 11* atau *Android 14*).
*   `device_type`: *Desktop*, *Mobile*, atau *Tablet*.
*   `screen_resolution`: Lebar x tinggi layar pengguna (contoh: *1920x1080*).
*   `timezone`: Zona waktu client (contoh: *Asia/Jakarta*).
*   `created_at`: Timestamp UTC.

### 3.3 Rate Limiting & Keamanan File
*   **Batas IP:** Maksimal 10 upload per 1 jam per IP (menggunakan sliding window in-memory / KV).
*   **Validasi MIME Magic Bytes:** Selain memeriksa ekstensi, serverless route memeriksa header Content-Type yang cocok dengan whitelist.
*   **Content-Disposition Sanitization:** Nama file dibersihkan dari karakter ilegal (*path traversal prevention* seperti `../`). Nama file saat disimpan di R2 menggunakan prefix ID unik acak.

---

## 4. Struktur Database & Data Model

Database menggunakan serverless SQL (Postgres / Turso SQLite).

### 4.1 Tabel `files`
| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | VARCHAR(12) PRIMARY KEY | ID unik pendek (contoh: `7k9xQ2mP`) |
| `filename` | VARCHAR(255) | Nama asli file (contoh: `proposal.pdf`) |
| `file_size` | BIGINT | Ukuran dalam bytes (maks 52.428.800 bytes) |
| `mime_type` | VARCHAR(100) | MIME type (contoh: `video/mp4`, `image/png`) |
| `category` | VARCHAR(20) | `image`, `video`, atau `document` |
| `r2_key` | VARCHAR(255) | Path objek di R2 (contoh: `files/7k9xQ2mP/proposal.pdf`) |
| `retention_months` | SMALLINT | 1, 3, atau 6 |
| `status` | VARCHAR(20) | `pending`, `active`, `expired`, `deleted` |
| `delete_token` | VARCHAR(64) | Hash token rahasia untuk penghapusan oleh uploader |
| `download_count` | INTEGER DEFAULT 0 | Counter unduhan |
| `created_at` | TIMESTAMP WITH TIME ZONE | Waktu upload |
| `expires_at` | TIMESTAMP WITH TIME ZONE | Waktu kadaluarsa file |

### 4.2 Tabel `upload_audit_logs`
| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | SERIAL PRIMARY KEY | ID log auto-increment |
| `file_id` | VARCHAR(12) REFERENCES files(id) | Relasi ke tabel files |
| `ip_address` | VARCHAR(45) | Alamat IP pengunggah |
| `country` | VARCHAR(10) | Negara pengunggah |
| `city` | VARCHAR(100) | Kota pengunggah |
| `user_agent` | TEXT | String raw user agent |
| `browser_name` | VARCHAR(50) | Nama browser |
| `browser_version` | VARCHAR(50) | Versi browser |
| `os_name` | VARCHAR(50) | Nama OS |
| `os_version` | VARCHAR(50) | Versi OS |
| `device_type` | VARCHAR(30) | Desktop / Mobile / Tablet |
| `screen_resolution` | VARCHAR(20) | Resolusi layar client |
| `timezone` | VARCHAR(50) | Zona waktu browser |
| `created_at` | TIMESTAMP WITH TIME ZONE | Timestamp pencatatan log |

---

## 5. Mekanisme Pembersihan & Kadaluarsa File (Lifecycle)

1.  **On-Access Soft Check:**
    Saat link `/f/[id]` dibuka, sistem memeriksa apakah `now() > expires_at`. Jika iya:
    *   Tampilkan status halaman *"File ini telah kedaluwarsa"*.
    *   Jalankan background task untuk menghapus objek dari Cloudflare R2 dan menandai status `expired`.
2.  **Vercel Scheduled Cron (`/api/cron/cleanup`):**
    *   Berjalan otomatis 1x per hari (setiap pukul 00:00 UTC).
    *   Mencari seluruh file yang memiliki `status = 'active'` dan `expires_at < now()`.
    *   Mengirimkan `DeleteObjectsCommand` ke Cloudflare R2 secara batch.
    *   Mengubah status file menjadi `expired`.
3.  **Cloudflare R2 Bucket Lifecycle Rule:**
    *   Bucket R2 dikonfigurasi dengan aturan lifecycle *expire after 180 days* (6 bulan) sebagai pengaman mutlak gratis.

---

## 6. Desain Antarmuka (UI/UX) - Referensi Desain Pengguna

Berdasarkan referensi desain visual yang dikirimkan oleh pengguna:

```
┌────────────────────────────────────────────────────────────────────────┐
│  [✈] DropLink                Beranda • Cara Kerja • FAQ • Tentang   [Masuk]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                Bagikan File dengan Link.                               │
│                   Cepat. Aman. Gratis.                                 │
│      Seret & lepas file kamu di sini. Tidak perlu daftar.              │
│                     Link otomatis dibuat.                              │
│                                                                        │
│        ┌ - - - - - - - - - - - - - - - - - - - - - - - - - - - ┐       │
│        │                        [☁↑]                           │       │
│        │                 Seret file ke sini                    │       │
│        │                        atau                           │       │
│        │              [ Klik untuk Upload File ]               │       │
│        └ - - - - - - - - - - - - - - - - - - - - - - - - - - - ┘       │
│                                                                        │
│   Mendukung PDF, Gambar, Dokumen, Video — Maks 50MB • Gratis & Tanpa Akun │
│                                                                        │
│        [ Opsi Masa Aktif: (o) 1 Bulan   ( ) 3 Bulan   ( ) 6 Bulan ]    │
│        [             Widget Cloudflare Turnstile Captcha           ]    │
│                                                                        │
│    ┌──────────────┐       ┌──────────────┐       ┌──────────────┐      │
│    │     [🛡]      │       │     [⏱]      │       │     [🔗]      │      │
│    │  Sederhana   │       │  Tanpa Akun  │       │ Link Instan  │      │
│    │ Cukup seret, │       │ Tidak perlu  │       │ Link siap    │      │
│    │  dapat link. │       │    login.    │       │  dibagikan.  │      │
│    └──────────────┘       └──────────────┘       └──────────────┘      │
│                                                                        │
│   Privasi terjaga • File terhapus otomatis setelah 1-6 bulan •         │
│               © 2024 DropLink • Kebijakan Privasi                      │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Elemen Visual & Tipografi
1.  **Navbar**:
    *   Logo: Ikon pesawat kertas / kirim warna biru dalam wadah rounded-xl, teks **DropLink** tebal hitam/dark slate.
    *   Menu navigasi: `Beranda`, `Cara Kerja`, `FAQ`, `Tentang`.
    *   Tombol kanan: `Masuk` (pill button biru khas DropLink).
2.  **Hero Section**:
    *   Headline: **Bagikan File dengan Link. Cepat. Aman. Gratis.** (font tebal, modern, ukuran responsif 36px–56px).
    *   Subheadline: "Seret & lepas file kamu di sini. Tidak perlu daftar. Link otomatis dibuat." (warna teks abu-abu elegan).
3.  **Dropzone Card**:
    *   Garis putus-putus biru lembut (`border-2 border-dashed border-blue-400 bg-white rounded-3xl p-8 md:p-12 shadow-sm`).
    *   Ikon: Awan biru dengan panah ke atas (`w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md`).
    *   Teks utama: **Seret file ke sini** (tebal 24px–28px).
    *   Pemisah: "atau" (teks halus abu-abu).
    *   Tombol aksi: **Klik untuk Upload File** (pill button `bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full transition-all`).
    *   Keterangan batas: "Mendukung PDF, Gambar, Dokumen, Video — Gambar maks 20MB, Video/Dokumen maks 50MB • Gratis & Tanpa Akun".
4.  **Kontrol Tambahan**:
    *   Pilihan masa aktif terintegrasi rapi: `1 Bulan` (default), `3 Bulan`, `6 Bulan`.
    *   Widget Cloudflare Turnstile yang terpasang mulus di atas tombol final submit.
    *   Progress bar upload yang menunjukkan kecepatan dan persentase secara real-time saat file dikirim ke Cloudflare R2.
5.  **3 Kolom Fitur Unggulan (Value Props)**:
    *   **Sederhana** (Ikon Perisai): "Cukup seret, dapatkan link, selesai."
    *   **Tanpa Akun** (Ikon Jam): "Tidak perlu login atau registrasi."
    *   **Link Instan** (Ikon Tautan): "Link langsung siap dibagikan."
6.  **Footer**:
    *   "Privasi terjaga • File terhapus otomatis setelah 1-6 bulan • © 2024 DropLink • Kebijakan Privasi"

---

### 6.2 Halaman Pratinjau & Unduh (`/f/[id]`)
Mengikuti bahasa desain yang sama (DropLink style):
*   Header dengan logo DropLink.
*   Kartu pratinjau utama di tengah dengan latar belakang putih bersih dan border halus.
*   Pratinjau media:
    *   Gambar: Lightbox/viewer gambar beresolusi tajam.
    *   Video: Pemutar HTML5 video responsif dengan kontrol play, pause, timeline, dan volume.
    *   Dokumen: Ikon dokumen yang sesuai dengan tipe file (PDF, Doc, Zip, dll.), nama asli file, dan ukuran MB.
*   Indikator status: "File ini akan kedaluwarsa pada [Tanggal] ([X] hari lagi)".
*   Tombol Aksi Utama: Tombol biru pill **Download File** dan tombol outline **Salin Link**.
*   Tombol Aksi Pemilik: Tombol merah halus **Hapus File Sekarang** jika token uploader cocok.

---

## 7. Rencana Integrasi & Deployment

*   **GitHub Repository:** Inisialisasi git di folder `Drop Link`, commit kode lengkap, lalu push ke remote repository GitHub pengguna.
*   **Vercel Deployment:** Hubungkan repositori GitHub ke Vercel dengan nama proyek `drop-link`.
*   **Environment Variables yang Dibutuhkan di Vercel:**
    *   `R2_ACCOUNT_ID`: ID Akun Cloudflare.
    *   `R2_ACCESS_KEY_ID`: S3 Access Key ID dari Cloudflare R2 API Tokens.
    *   `R2_SECRET_ACCESS_KEY`: S3 Secret Access Key dari Cloudflare R2.
    *   `R2_BUCKET_NAME`: Nama bucket Cloudflare R2 (contoh: `drop-link-storage`).
    *   `R2_PUBLIC_DOMAIN` (Opsional/Custom Domain): Domain publik R2 untuk CDN streaming/download.
    *   `DATABASE_URL`: Connection string serverless database (Neon/Postgres/Turso).
    *   `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Site key Cloudflare Turnstile.
    *   `TURNSTILE_SECRET_KEY`: Secret key Cloudflare Turnstile.
    *   `CRON_SECRET`: Kunci otentikasi untuk Vercel Cron cleanup endpoint.

---

## 8. Verifikasi & Pengujian
*   **Uji Batas Ukuran:** Memastikan file gambar >20MB dan video/dokumen >50MB ditolak sebelum upload.
*   **Uji Turnstile:** Memastikan upload tanpa verifikasi captcha ditolak oleh server.
*   **Uji Direct Upload R2:** Memastikan file berhasil masuk ke bucket R2 tanpa melalui Vercel bandwidth.
*   **Uji Log Perangkat:** Memastikan IP dan data OS/Browser tercatat dengan rapi di database.
*   **Uji Delete Token:** Memastikan uploader dapat menghapus file sebelum masa kadaluarsa.
*   **Uji Cron Cleanup:** Memastikan file yang melewati `expires_at` terhapus dari R2 dan database.
