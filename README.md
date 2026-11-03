# Iniyandit Application Center
### Integrated Healthcare Application Portal — UPTD Puskesmas Iniyandit
> *"One Account. One Portal. All Applications."*

**Iniyandit Application Center** adalah pusat akses satu pintu (*One-Stop Digital Application Launcher & Internal Desktop Workspace*) yang dirancang khusus untuk mempermudah seluruh petugas **UPTD Puskesmas Iniyandit** dalam membuka berbagai aplikasi pelayanan kesehatan dari Kementerian Kesehatan, Dinas Kesehatan, BPJS Kesehatan, Pemerintah Daerah, dan aplikasi internal Puskesmas (seperti **SIPANDIT**, **SATUSEHAT**, **e-Puskesmas**, **ASIK**, **P-Care BPJS**, **SISDMK**, dll.) dalam satu aplikasi terpadu.

- **Institusi:** UPTD Puskesmas Iniyandit
- **Perancang & Pengembang Aplikasi:** **Sulfikri Hidayat, S.Tr.Kes.**

---

## Daftar Isi
1. [Arsitektur & Teknologi Proyek](#1-arsitektur--teknologi-proyek)
2. [Fitur Utama](#2-fitur-utama)
3. [Struktur Direktori](#3-struktur-direktori)
4. [Cara Menjalankan Versi Web (Development & Production)](#4-cara-menjalankan-versi-web-development--production)
5. [Cara Menjalankan Versi Desktop Electron (Windows)](#5-cara-menjalankan-versi-desktop-electron-windows)
6. [Konfigurasi Firebase & Environment Variables](#6-konfigurasi-firebase--environment-variables)
7. [Panduan Integrasi GitHub & CI/CD Otomatis](#7-panduan-integrasi-github--cicd-otomatis)
8. [Panduan Deployment Website ke Netlify](#8-panduan-deployment-website-ke-netlify)
9. [Cara Build Installer Windows (.exe NSIS & Portable)](#9-cara-build-installer-windows-exe-nsis--portable)
10. [Dokumentasi Fitur Iniyandit Smart Login](#10-dokumentasi-fitur-iniyandit-smart-login)
11. [Dokumentasi Fitur Mode Layar Penuh (Full Screen)](#11-dokumentasi-fitur-mode-layar-penuh-full-screen)
12. [Troubleshooting & Penanganan Masalah Umum](#12-troubleshooting--penanganan-masalah-umum)

---

## 1. Arsitektur & Teknologi Proyek

| Lapisan | Teknologi |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion |
| **Routing & PWA** | React Router v7 (`BrowserRouter`), `vite-plugin-pwa` (Service Worker & Web App Manifest) |
| **Backend & Database** | Firebase Authentication (Google Sign-In), Cloud Firestore (Enterprise Edition), Zero-Trust `firestore.rules` |
| **Windows Desktop Wrapper** | Electron (`BrowserWindow` + `WebContentsView` Multi-Tab Internal Workspace + `contextBridge` Preload) |
| **Keamanan Kredensial Lokal** | Electron `safeStorage` (Windows DPAPI) + Fallback `AES-256-GCM` (`scrypt`) di penyimpanan lokal perangkat |
| **Testing & Quality Gate** | Node Built-in Test Runner (`node:test` via `tsx`), `@firebase/eslint-plugin-security-rules`, Playwright CLI |

---

## 2. Fitur Utama

1. **Dashboard Publik Tanpa Login untuk Petugas:**
   - Petugas Puskesmas dapat langsung mengakses seluruh aplikasi kerja tanpa harus login ke portal.
   - Pencarian instan (`Ctrl + K` / kolom pencarian), filter kategori (Kemenkes, Dinas Kesehatan, BPJS, Pemda, Administrasi, Kesling, Internal), bagian Aplikasi Unggulan, Favorit, dan Terakhir Dibuka.
2. **Internal Application Workspace & Multi-Tab Manager:**
   - Membuka aplikasi eksternal (SIPANDIT, e-Puskesmas, BPJS, dll.) langsung di dalam area kerja Iniyandit Application Center tanpa harus berpindah ke browser eksternal.
   - Pada **Desktop Windows (Electron)**: Menggunakan `WebContentsView` native dengan sesi persisten terisolasi (`persist:iniyandit-workspace`), sehingga website pemerintah yang memblokir iframe (`X-Frame-Options: DENY` / `CSP frame-ancestors`) tetap dapat dibuka secara penuh di dalam jendela aplikasi.
   - Pada **Web Browser**: Menyediakan workspace internal multi-tab dengan asisten diagnostik kompatibilitas dan tombol fallback cepat **"Buka di Tab Browser"** jika situs tujuan memblokir penyematan frame di browser web.
   - Dilengkapi navigasi lengkap: **Kembali (Back)**, **Maju (Forward)**, **Muat Ulang (Reload)**, **Beranda Aplikasi (Home)**, **Kembali ke Dashboard**, dan **Sidebar Aplikasi Collapsible**.
3. **Iniyandit Smart Login (Asisten Kredensial Lokal Opsional):**
   - Menyimpan username dan password aplikasi kerja secara **opsional** berdasarkan persetujuan eksplisit petugas (*"Simpan Akun"*, *"Jangan Pernah Simpan"*, *"Nanti Saja"*).
   - Kredensial dienkripsi secara lokal di perangkat (menggunakan Windows DPAPI `safeStorage` / `AES-256-GCM`) dan **tidak pernah dikirim ke database cloud / Firestore**.
   - Mendukung **Isi Otomatis (Autofill)** pada form login yang kompatibel tanpa menekan tombol submit secara paksa.
4. **Mode Layar Penuh (Full Screen Workspace):**
   - Tombol **`⛶ Full Screen`** di kanan atas toolbar aplikasi internal untuk memperluas ruang kerja aplikasi hingga 100% layar dengan menyembunyikan header, tab bar, sidebar, dan toolbar.
   - Cara keluar yang aman dan berlapis: tombol **`Esc`**, **`F11`**, **`Ctrl + Shift + F`**, atau tombol melayang **`⛶ Keluar Full Screen (Esc)`** di kanan atas layar.
5. **Panel Manajemen Admin & Keamanan Zero-Trust:**
   - Login khusus Admin via Google Sign-In (`/admin/login`).
   - CRUD Aplikasi, CRUD Kategori, Manajemen Admin & Super Admin, Statistik Penggunaan, Pengaturan Portal, Backup/Export JSON, dan Log Aktivitas.

---

## 3. Struktur Direktori

```text
├── .github/workflows/
│   └── build.yml                  # GitHub Actions CI/CD (Test, Web Build, Windows .exe Build)
├── electron/
│   ├── main.cjs                   # Electron Main Process (BrowserWindow, WebContentsView, Local SPA Server, IPC)
│   ├── preload.cjs                # Preload Script (contextBridge window.iniyanditDesktop)
│   ├── security.cjs               # Kebijakan keamanan URL (HTTP/HTTPS) & WebPreferences
│   └── credentialVault.cjs        # Penyimpanan terenkripsi Smart Login (safeStorage + AES-256-GCM)
├── public/
│   ├── _redirects                 # Aturan SPA routing untuk Netlify
│   ├── favicon.ico / favicon.svg  # Favicon resmi Iniyandit Application Center
│   ├── icon-192.png / icon-512.png# Ikon PWA & Windows Installer
│   └── logo.svg                   # Logo vektor resmi Iniyandit Application Center
├── src/
│   ├── components/
│   │   ├── BrandLogo.tsx          # Komponen identitas visual & logo resmi
│   │   ├── DeveloperIdentity.tsx  # Modal Tentang Aplikasi & Identitas Pengembang
│   │   └── workspace/             # Komponen Multi-Tab Workspace, InternalBrowser, SmartLoginModals
│   ├── context/
│   │   └── PortalContext.tsx      # State global aplikasi, autentikasi Admin, & sinkronisasi Firestore
│   ├── firebase/
│   │   └── config.ts              # Inisialisasi Firebase SDK + dukungan override VITE_FIREBASE_*
│   ├── layouts/
│   │   └── AdminLayout.tsx        # Layout panel administrasi
│   ├── pages/
│   │   ├── PublicDashboard.tsx    # Dashboard utama petugas + Workspace aplikasi internal
│   │   └── admin/                 # Halaman Login Admin, Manajemen Aplikasi, Kategori, Admin, Statistik, Pengaturan
│   ├── services/
│   │   └── seedData.ts            # Data awal aplikasi kesehatan & kategori Puskesmas Iniyandit
│   └── utils/
│       ├── desktopWorkspace.ts    # Logika Multi-Tab, kalkulasi bounds WebContentsView, & shortcut Full Screen
│       ├── externalLauncher.ts    # Validasi URL & pembuka aplikasi
│       ├── smartLogin.ts          # Brankas kredensial Smart Login & deteksi kompatibilitas
│       ├── validation.ts          # Validasi schema payload Firestore
│       └── validation.test.ts     # Unit test suite (node:test)
├── electron-builder.json          # Konfigurasi pembuat installer Windows (.exe NSIS & Portable)
├── eslint.config.js               # Konfigurasi ESLint untuk Firestore Security Rules
├── firebase-applet-config.json    # Konfigurasi proyek Firebase default
├── firebase-blueprint.json        # Blueprint entitas & koleksi Firestore
├── firestore.rules                # Aturan keamanan Firestore (Zero-Trust ABAC)
├── netlify.toml                   # Konfigurasi build, redirect SPA, & security headers Netlify
├── package.json                   # Daftar dependensi & skrip npm
└── vite.config.ts                 # Konfigurasi Vite + Tailwind CSS + PWA
```

---

## 4. Cara Menjalankan Versi Web (Development & Production)

### Prasyarat
- **Node.js** versi `20.x` atau `22.x` LTS
- **npm** versi `10+`

### Langkah-langkah
```bash
# 1. Instal seluruh dependensi
npm install

# 2. Jalankan server pengembangan (http://localhost:3000)
npm run dev

# 3. Jalankan pengujian unit dan pemeriksaan tipe TypeScript
npm test
npm run lint
npm run lint:rules

# 4. Build untuk produksi web (output di folder dist/)
npm run build

# 5. Pratinjau hasil build produksi secara lokal
npm run preview
```

---

## 5. Cara Menjalankan Versi Desktop Electron (Windows)

Untuk menjalankan aplikasi sebagai aplikasi desktop Electron di komputer lokal (Windows / macOS / Linux):

```bash
# 1. Instal dependensi proyek
npm install

# 2. Instal paket runtime Electron (jika belum terpasang di node_modules lokal)
npm install --no-save electron@^35.0.0 electron-builder@^26.0.0

# 3. Opsi A — Jalankan Electron terhubung ke dev server Vite (Development Mode):
# Terminal 1:
npm run dev
# Terminal 2:
npm run electron:dev

# 4. Opsi B — Jalankan Electron menggunakan hasil build produksi (Production Mode):
npm run build
npm run electron:start
```

> **Catatan Arsitektur Desktop:** Pada mode produksi (`electron:start` atau hasil installer `.exe`), `electron/main.cjs` secara otomatis menjalankan server statis loopback internal (`http://localhost:<port>`) untuk melayani `dist/`. Hal ini memastikan `BrowserRouter` (`/admin/login`, `/admin/dashboard`) dan autentikasi Google Sign-In Firebase bekerja 100% identik dengan versi web.

---

## 6. Konfigurasi Firebase & Environment Variables

Secara bawaan, proyek telah terhubung ke proyek Firebase melalui `firebase-applet-config.json`. Jika Anda ingin menggunakan environment variables (misalnya pada **Netlify** atau **GitHub Actions**), salin `.env.example` menjadi `.env` atau tambahkan variabel berikut di dashboard hosting Anda:

```env
VITE_FIREBASE_PROJECT_ID="project-id-anda"
VITE_FIREBASE_APP_ID="app-id-anda"
VITE_FIREBASE_API_KEY="api-key-anda"
VITE_FIREBASE_AUTH_DOMAIN="project-id-anda.firebaseapp.com"
VITE_FIREBASE_STORAGE_BUCKET="project-id-anda.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="sender-id-anda"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
VITE_FIREBASE_FIRESTORE_DATABASE_ID="database-id-anda"
```

> **Penting untuk Autentikasi Google Sign-In di Domain Baru:**
> Ketika aplikasi di-deploy ke domain baru (misalnya `iniyandit-app-center.netlify.app`), tambahkan domain tersebut ke **Firebase Console → Authentication → Settings → Authorized domains** agar login Admin berfungsi.

---

## 7. Panduan Integrasi GitHub & CI/CD Otomatis

Proyek ini telah dilengkapi konfigurasi `.gitignore` yang bersih dan workflow GitHub Actions di `.github/workflows/build.yml`.

### Cara Push ke Repository GitHub:
```bash
git init
git add .
git commit -m "feat: release Iniyandit Application Center web & Windows desktop"
git branch -M main
git remote add origin https://github.com/<username-anda>/iniyandit-application-center.git
git push -u origin main
```

Setiap kali Anda melakukan `git push` ke branch `main`:
1. Job **`verify-and-build-web`** akan menjalankan TypeScript check (`npm run lint`), validasi aturan keamanan Firestore (`npm run lint:rules`), seluruh unit test (`npm test`), dan mem-build bundle web (`dist/`).
2. Job **`build-windows-desktop`** akan berjalan pada runner `windows-latest` untuk menghasilkan installer Windows **`.exe` (NSIS Setup & Portable)** dan mengunggahnya sebagai *GitHub Actions Artifact* yang siap diunduh.

---

## 8. Panduan Deployment Website ke Netlify

Proyek ini telah dilengkapi file `netlify.toml` dan `public/_redirects` sehingga siap di-deploy ke **Netlify** tanpa error `404 Page Not Found` saat halaman di-refresh.

### Langkah-langkah Deploy di Netlify:
1. Masuk ke [Netlify Dashboard](https://app.netlify.com/) dan pilih **Add new site → Import an existing project**.
2. Hubungkan dengan repository **GitHub** `iniyandit-application-center`.
3. Netlify akan otomatis mendeteksi pengaturan dari `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** `22`
4. *(Opsional)* Jika ingin mengganti konfigurasi Firebase melalui environment variable, buka **Site configuration → Environment variables** dan isi variabel `VITE_FIREBASE_*` sesuai `.env.example`.
5. Klik **Deploy site**.
6. Setelah mendapatkan domain Netlify (mis. `https://iniyandit-app-center.netlify.app`), daftarkan domain tersebut pada **Firebase Console → Authentication → Settings → Authorized domains**.

---

## 9. Cara Build Installer Windows (.exe NSIS & Portable)

Anda dapat membuat file installer Windows (`.exe`) dengan dua cara:

### Cara 1: Otomatis via GitHub Actions (Tanpa Perlu PC Windows Lokal)
1. Push kode ke GitHub.
2. Buka tab **Actions** di repository GitHub Anda.
3. Pilih workflow **Build & Verify — Iniyandit Application Center (Web & Windows Desktop)**.
4. Unduh artifact **`Iniyandit-Application-Center-Windows-x64`** yang berisi:
   - `Iniyandit-Application-Center-Setup-1.0.0.exe` (Installer NSIS dengan shortcut Desktop & Start Menu)
   - `Iniyandit-Application-Center-Portable-1.0.0.exe` (Versi Portable siap pakai tanpa instalasi)

### Cara 2: Build Lokal di Komputer Windows 10/11 (x64)
```bash
# 1. Instal dependensi proyek
npm install

# 2. Instal Electron & Electron Builder
npm install --no-save electron@^35.0.0 electron-builder@^26.0.0

# 3. Jalankan perintah build Windows
npm run electron:build:win
```
Hasil installer akan tersedia di folder `release/`.

---

## 10. Dokumentasi Fitur Iniyandit Smart Login

**Iniyandit Smart Login** adalah fitur asisten kredensial opsional untuk membantu petugas UPTD Puskesmas Iniyandit agar tidak perlu mengetik ulang username dan password saat membuka aplikasi rutin (seperti SIPANDIT atau e-Puskesmas).

- **100% Opsional & Berbasis Persetujuan:** Akun hanya disimpan jika petugas menekan tombol **"Simpan Akun"** dan mengisi kredensial secara sadar.
- **Penyimpanan Lokal Terenkripsi:**
  - Di **Electron Desktop Windows**: Menggunakan `safeStorage` (Windows Data Protection API / DPAPI) dengan fallback `AES-256-GCM` (`scrypt`) di dalam folder `AppData\Roaming\Iniyandit Application Center\smart-login-vault.json`.
  - Di **Browser Web**: Disimpan secara lokal di perangkat dengan enkripsi terisolasi per aplikasi & origin.
  - **Tidak pernah dikirim ke server atau Firestore.**
- **Cara Kerja Autofill:**
  - Saat aplikasi dibuka di dalam workspace internal, sistem mendeteksi field username/email/NIP dan password yang kompatibel, lalu mengisi nilai secara otomatis.
  - Sistem **tidak pernah menekan tombol Login/Submit secara otomatis** demi keamanan dan memberi kesempatan petugas memeriksa kembali akunnya.
  - Jika situs eksternal menggunakan sistem autentikasi khusus (SSO/CAPTCHA/iframe lintas domain) yang membatasi autofill, petugas dapat menyalin username/password melalui panel **Smart Login** dengan satu klik.

---

## 11. Dokumentasi Fitur Mode Layar Penuh (Full Screen)

Ketika petugas membuka aplikasi di dalam **Internal Application Workspace**:
- Klik tombol **`⛶ Full Screen`** di pojok kanan atas toolbar aplikasi internal untuk masuk ke mode layar penuh.
- Seluruh elemen navigasi portal (Header utama, Tab Bar, Sidebar aplikasi, dan Toolbar internal) akan disembunyikan sehingga aplikasi kerja yang sedang dibuka memenuhi **100% layar**.
- **Cara Keluar dari Mode Full Screen:**
  1. Tekan tombol **`Escape` (`Esc`)** pada keyboard.
  2. Tekan tombol **`F11`** pada keyboard.
  3. Tekan kombinasi **`Ctrl + Shift + F`**.
  4. Klik tombol melayang **`⛶ Keluar Full Screen (Esc)`** di pojok kanan atas layar.

---

## 12. Troubleshooting & Penanganan Masalah Umum

| Masalah | Penyebab | Solusi |
| :--- | :--- | :--- |
| **Aplikasi eksternal tidak tampil di dalam frame pada versi Web Browser** | Website tujuan (mis. Kemenkes / BPJS) mengirim header `X-Frame-Options: DENY` atau `CSP frame-ancestors` yang memblokir iframe di browser biasa. | Gunakan tombol **"Buka di Tab Browser"** pada toolbar, atau gunakan **Iniyandit Application Center versi Desktop Windows (`.exe`)** yang menggunakan `WebContentsView` sehingga bebas dari batasan iframe browser. |
| **Gagal Login Admin di domain Netlify baru (`auth/unauthorized-domain`)** | Domain Netlify belum didaftarkan di Firebase Authentication. | Buka **Firebase Console → Authentication → Settings → Authorized domains**, lalu tambahkan domain Netlify Anda. |
| **Autofill Smart Login tidak mengisi form secara otomatis pada versi Web** | Kebijakan keamanan browser (*Same-Origin Policy*) melarang halaman induk mengisi input di dalam frame lintas-domain (*cross-origin*). | Gunakan tombol **Salin Username / Salin Password** pada bar Smart Login di versi Web, atau gunakan versi **Desktop Windows (Electron)** untuk autofill otomatis lintas domain melalui `WebContentsView`. |
| **Halaman `/admin/login` menampilkan 404 saat di-refresh di hosting statis** | Server hosting belum mengarahkan rute SPA ke `index.html`. | Pastikan `netlify.toml` dan `public/_redirects` ikut ter-deploy (`/* /index.html 200`). |

---

© 2026 **UPTD Puskesmas Iniyandit** — Dirancang dan Dikembangkan oleh **Sulfikri Hidayat, S.Tr.Kes.**
