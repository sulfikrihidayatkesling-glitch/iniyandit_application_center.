import React from 'react';
import {
  CheckCircle2,
  Download,
  HardDriveDownload,
  Layers,
  Monitor,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { IniyanditLogo } from '../brand/IniyanditLogo';

export function PWAInstallButton() {
  const { showIOSGuide, setShowIOSGuide } = usePWAInstall();

  return (
    <>
      <button
        type="button"
        onClick={() => setShowIOSGuide(true)}
        title="Installer Desktop Windows (.exe) & Arsitektur Electron WebContentsView"
        aria-label="Instal Aplikasi"
        className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F0FDFA] hover:bg-teal-100/80 text-[#0F766E] border border-[#14B8A6]/35 text-xs font-bold transition-all cursor-pointer shrink-0"
      >
        <Monitor className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden xl:inline">Desktop Windows (.exe)</span>
      </button>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-installer-guide-title"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white border border-[#E2E8F0] p-6 sm:p-7 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <IniyanditLogo variant="square" size={48} />
                <div>
                  <h3
                    id="desktop-installer-guide-title"
                    className="text-base sm:text-lg font-extrabold text-[#0F172A]"
                  >
                    Iniyandit Application Center — Windows Desktop (.exe)
                  </h3>
                  <p className="text-xs font-semibold text-[#0F766E]">
                    Integrated Web Application Launcher (Electron + WebContentsView)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Tutup panduan desktop"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed mb-4">
              <strong>Iniyandit Application Center</strong> dirancang sebagai aplikasi desktop
              Windows mandiri. Seluruh aplikasi kerja yang terdaftar (SIPANDIT, e-Puskesmas, BPJS,
              KRISNA, SKAMRT, CKG, SI GIZI, Kemenkes) dibuka langsung di dalam jendela aplikasi
              menggunakan sistem <strong>Multi-Tab Internal Browser</strong> tanpa membuka Google
              Chrome secara terpisah.
            </p>

            <div className="space-y-3 text-xs text-[#0F172A]">
              <div className="p-3.5 rounded-2xl bg-[#F0FDFA] border border-[#14B8A6]/35 flex items-start gap-3">
                <Layers className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#064E3B]">
                    1. Arsitektur Electron BrowserWindow + WebContentsView
                  </p>
                  <p className="text-[#475569] mt-0.5 leading-relaxed">
                    Menggunakan <code>BrowserWindow</code> untuk dashboard utama dan{' '}
                    <code>WebContentsView</code> modern untuk merender setiap tab aplikasi eksternal
                    di dalam area konten utama (dilengkapi tombol Kembali, Maju, Refresh, Beranda,
                    dan Sidebar Daftar Aplikasi).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0F172A]">
                    2. Isolasi Keamanan &amp; Penanganan Kompatibilitas
                  </p>
                  <p className="text-[#64748B] mt-0.5 leading-relaxed">
                    Dikonfigurasi dengan <code>contextIsolation: true</code>,{' '}
                    <code>nodeIntegration: false</code>, dan <code>sandbox: true</code>. Apabila
                    suatu website menolak ditampilkan karena kebijakan keamanan/CSP/SSO khusus,
                    tersedia layar diagnostik dan tombol cadangan{' '}
                    <strong>Buka di Browser Eksternal</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 flex items-start gap-3">
                <Terminal className="w-5 h-5 text-[#A3E635] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">
                    3. Kompilasi File Installer Windows (.exe NSIS)
                  </p>
                  <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                    Seluruh konfigurasi <code>electron/main.cjs</code>,{' '}
                    <code>electron/preload.cjs</code>, dan <code>electron-builder.json</code> telah
                    tersedia di dalam proyek untuk menghasilkan installer{' '}
                    <strong>Iniyandit-Application-Center-Setup-1.0.0.exe</strong> (lengkap dengan
                    Shortcut Desktop, Start Menu, dan Uninstaller):
                  </p>
                  <pre className="mt-2 p-2.5 rounded-xl bg-black/60 text-[#A3E635] font-mono text-[11px] overflow-x-auto">
                    npm install --save-dev electron electron-builder{'\n'}npm run electron:build:win
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <a
                  href="/favicon.ico?v=2"
                  download="Iniyandit-Application-Center.ico"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
                >
                  <HardDriveDownload className="w-3.5 h-3.5" />
                  <span>Unduh Ikon .ICO Windows</span>
                </a>
                <a
                  href="/icon-512.png?v=2"
                  download="Icon-Iniyandit-Application-Center-512.png"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Ikon PNG (512px)</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mengerti</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
