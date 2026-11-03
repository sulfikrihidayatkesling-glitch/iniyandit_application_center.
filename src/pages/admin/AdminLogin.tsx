import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { useToast } from '../../components/common/ToastContext';
import { IniyanditLogo } from '../../components/brand/IniyanditLogo';
import { PuskesmasLoginIllustration } from '../../components/brand/PuskesmasHeroIllustration';

function mapAuthErrorToIndonesian(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes('auth/invalid-credential') ||
    msg.includes('auth/wrong-password') ||
    msg.includes('auth/user-not-found')
  ) {
    return 'Email atau password tidak sesuai. Pastikan akun Admin terdaftar di Firebase Authentication.';
  }
  if (msg.includes('auth/operation-not-allowed')) {
    return 'Metode login Email/Password belum diaktifkan di Firebase Console. Gunakan tombol "Masuk dengan Google (Admin)" di bawah atau aktifkan Email/Password di Firebase Console.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Terlalu banyak percobaan login yang gagal. Silakan tunggu beberapa saat atau gunakan fitur Lupa Password.';
  }
  if (msg.includes('auth/popup-closed-by-user')) {
    return 'Jendela login Google ditutup sebelum proses autentikasi selesai.';
  }
  if (msg.includes('auth/invalid-email')) {
    return 'Format alamat email tidak valid.';
  }
  return 'Gagal melakukan autentikasi. Periksa kembali kredensial Anda.';
}

export function AdminLogin() {
  const navigate = useNavigate();
  const {
    user,
    authReady,
    isAdmin,
    adminChecking,
    loginWithEmail,
    loginWithGoogle,
    sendResetPassword,
    logoutAdmin,
    settings,
  } = usePortal();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Firebase Auth Guide toggle
  const [showAuthGuide, setShowAuthGuide] = useState(false);

  useEffect(() => {
    if (authReady && !adminChecking && user && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [authReady, adminChecking, user, isAdmin, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Mohon masukkan alamat email dan password Administrator.');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
      showToast({
        type: 'success',
        title: 'Autentikasi Berhasil',
        description: 'Selamat datang di Dashboard Admin Iniyandit Application Center.',
      });
    } catch (err) {
      setErrorMessage(mapAuthErrorToIndonesian(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      showToast({
        type: 'success',
        title: 'Login Google Berhasil',
        description: 'Memverifikasi kewenangan Administrator...',
      });
    } catch (err) {
      setErrorMessage(mapAuthErrorToIndonesian(err));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSuccess(null);
    setErrorMessage(null);

    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      setErrorMessage('Masukkan alamat email Admin untuk menerima tautan reset password.');
      return;
    }

    setResetSubmitting(true);
    try {
      await sendResetPassword(targetEmail);
      setResetSuccess(
        `Tautan pemulihan password telah dikirim ke ${targetEmail}. Silakan periksa kotak masuk atau folder spam email Anda.`
      );
      showToast({
        type: 'success',
        title: 'Email Pemulihan Terkirim',
        description: `Instruksi reset password dikirim ke ${targetEmail}.`,
      });
    } catch (err) {
      setErrorMessage(mapAuthErrorToIndonesian(err));
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F0FDFA] via-[#F8FAFC] to-[#E2E8F0] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10">
      {/* Top Back to Public Portal Link */}
      <div className="w-full max-w-5xl mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0F766E] hover:text-[#0D9488] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Petugas</span>
        </Link>
        <span className="text-xs font-medium text-[#64748B]">
          Akses Khusus Administrator Terotorisasi
        </span>
      </div>

      {/* Main Split-Screen Card */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-[#E2E8F0] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Branding Panel */}
        <div className="lg:col-span-5 bg-linear-to-b from-[#094D47] via-[#0F766E] to-[#0D9488] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="z-10 my-auto py-4">
            <IniyanditLogo
              variant="login"
              size={68}
              portalName={settings.portalName}
              institutionName={settings.institutionName}
              tagline={settings.tagline}
              customLogoUrl={settings.logoUrl}
              officialLogoUrl={settings.officialLogoUrl}
            />
            <p className="text-xs sm:text-sm italic text-teal-50/90 text-center mt-6 max-w-xs mx-auto leading-relaxed">
              &ldquo;Kelola Aplikasi dengan Mudah, Untuk Pelayanan yang Lebih Baik&rdquo;
            </p>
          </div>

          {/* Bottom Building Illustration Accent */}
          <div className="mt-6 -mx-8 sm:-mx-10 -mb-10 h-40 opacity-95 pointer-events-none">
            <PuskesmasLoginIllustration className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center sm:text-left mb-7">
              <span className="text-xs font-bold tracking-wider text-[#0F766E] uppercase">
                Admin Portal
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1">
                Login Admin
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Masuk untuk mengelola aplikasi, kategori, dan pengaturan portal.
              </p>
            </div>

            {/* If logged in as a non-admin account, display Role Rejection Notice */}
            {authReady && !adminChecking && user && !isAdmin && (
              <div
                className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold">
                      Akses Ditolak — Bukan Akun Administrator
                    </p>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Akun <span className="font-semibold">{user.email}</span> (UID:{' '}
                      <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">
                        {user.uid}
                      </code>
                      ) belum terdaftar sebagai Administrator aktif atau email belum terverifikasi.
                    </p>
                    <button
                      type="button"
                      onClick={() => logoutAdmin()}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Keluar & Gunakan Akun Admin Lain
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#0F766E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@puskesmas-iniyandit.go.id"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] focus:border-[#14B8A6] text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#14B8A6]/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#0F766E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Admin"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] focus:border-[#14B8A6] text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#14B8A6]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="inline-flex items-center gap-2 text-[#64748B] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <span>Ingat Saya</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetSuccess(null);
                    setResetModalOpen(true);
                  }}
                  className="font-semibold text-[#0F766E] hover:underline cursor-pointer"
                >
                  Lupa Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || googleSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] disabled:opacity-60 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Login...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider for Google Workspace / Firebase Auth Admin Login */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-medium">
                  atau autentikasi cepat Firebase
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting || googleSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#0F172A] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
            >
              {googleSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
              )}
              <span>Masuk dengan Akun Google Admin</span>
            </button>

            {/* Collapsible Firebase Setup Info */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowAuthGuide((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F766E] transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Panduan Akun Admin & Konfigurasi Firebase</span>
              </button>

              {showAuthGuide && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-slate-800">
                    Otorisasi Admin Terpercaya (Tanpa Registrasi Publik):
                  </p>
                  <p>
                    1. <strong>Login Cepat Google:</strong> Akun Administrator utama yang
                    terprovisi otomatis dapat langsung masuk menggunakan tombol{' '}
                    <strong>Masuk dengan Akun Google Admin</strong>.
                  </p>
                  <p>
                    2. <strong>Login Email &amp; Password:</strong> Untuk menggunakan metode Email
                    &amp; Password, aktifkan provider <em>Email/Password</em> pada{' '}
                    <strong>Firebase Console &rarr; Authentication &rarr; Sign-in method</strong>,
                    lalu tambahkan user Admin dan daftarkan UID-nya pada menu{' '}
                    <strong>Manajemen Admin</strong>.
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-0.5">
                <p className="text-[11px] text-slate-500 font-medium">
                  Dirancang dan Dikembangkan oleh{' '}
                  <span className="font-bold text-[#0F172A]">Sulfikri Hidayat, S.Tr.Kes.</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  © {new Date().getFullYear()} {settings.portalName || 'Iniyandit Application Center'} · {settings.institutionName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {resetModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <h3 id="reset-password-title" className="text-lg font-bold text-[#0F172A]">
              Pemulihan Password Admin
            </h3>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Masukkan alamat email Administrator yang terdaftar di Firebase Authentication untuk
              menerima tautan pengaturan ulang password.
            </p>

            {resetSuccess ? (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{resetSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="reset-email-input"
                    className="block text-xs font-semibold text-[#0F172A] mb-1"
                  >
                    Email Administrator
                  </label>
                  <input
                    id="reset-email-input"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@puskesmas-iniyandit.go.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-semibold cursor-pointer"
                  >
                    {resetSubmitting ? 'Mengirim...' : 'Kirim Tautan Reset'}
                  </button>
                </div>
              </form>
            )}

            {resetSuccess && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
