import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { ApplicationItem } from '../../types';
import { SMART_LOGIN_SECURITY_NOTICE, validateSmartLoginInput } from '../../utils/smartLogin';

interface SmartLoginSaveModalProps {
  open: boolean;
  targetApp: ApplicationItem | null;
  applications: ApplicationItem[];
  initialUsername?: string;
  initialAutofillEnabled?: boolean;
  isUpdatingExisting?: boolean;
  onClose: () => void;
  onSaveCredential: (payload: {
    appId: string;
    appName: string;
    appUrl: string;
    username: string;
    password: string;
    autofillEnabled: boolean;
  }) => Promise<void>;
  onDontSaveForApp: (app: ApplicationItem) => Promise<void>;
}

export function SmartLoginSaveModal({
  open,
  targetApp,
  applications,
  initialUsername = '',
  initialAutofillEnabled = true,
  isUpdatingExisting = false,
  onClose,
  onSaveCredential,
  onDontSaveForApp,
}: SmartLoginSaveModalProps) {
  const [selectedAppId, setSelectedAppId] = useState<string>(targetApp?.id || '');
  const [username, setUsername] = useState<string>(initialUsername);
  const [password, setPassword] = useState<string>('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [autofillEnabled, setAutofillEnabled] = useState<boolean>(initialAutofillEnabled);
  const [deviceConfirmed, setDeviceConfirmed] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedAppId(targetApp?.id || applications[0]?.id || '');
      setUsername(initialUsername || '');
      setPassword('');
      setShowPasswordInput(false);
      setAutofillEnabled(initialAutofillEnabled);
      setDeviceConfirmed(true);
      setFormError(null);
    }
  }, [open, targetApp, applications, initialUsername, initialAutofillEnabled]);

  if (!open) return null;

  const currentApp =
    applications.find((a) => a.id === selectedAppId) || targetApp || applications[0] || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApp) {
      setFormError('Pilih aplikasi terlebih dahulu.');
      return;
    }

    if (!deviceConfirmed) {
      setFormError(
        'Centang konfirmasi bahwa perangkat ini aman untuk menyimpan akun lokal, atau pilih "Jangan Simpan Akun".'
      );
      return;
    }

    const check = validateSmartLoginInput({
      appId: currentApp.id,
      username,
      password,
    });

    if (!check.valid) {
      setFormError(
        check.errors.username || check.errors.password || check.errors.appId || 'Input tidak valid.'
      );
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await onSaveCredential({
        appId: currentApp.id,
        appName: currentApp.name,
        appUrl: currentApp.url,
        username: username.trim(),
        password,
        autofillEnabled,
      });
      setPassword('');
      onClose();
    } catch {
      setFormError('Gagal mengenkripsi dan menyimpan kredensial pada perangkat ini.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDontSave = async () => {
    if (!currentApp) {
      onClose();
      return;
    }
    setSubmitting(true);
    try {
      await onDontSaveForApp(currentApp);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-login-save-title"
      data-testid="smart-login-save-modal"
    >
      <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-[#064E3B] via-[#0F766E] to-[#0D9488] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="smart-login-save-title" className="text-base sm:text-lg font-extrabold">
                {isUpdatingExisting
                  ? `Ganti Akun Tersimpan — ${currentApp?.name || 'Aplikasi'}`
                  : `Iniyandit Smart Login — Simpan Akun`}
              </h2>
              <p className="text-xs text-teal-100">
                Penyimpanan Kredensial Lokal Terenkripsi (Opsional)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog simpan akun"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mandatory Security Warning Notice (Section 5) */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200/90 p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold text-amber-950 mb-0.5">
                Peringatan Keamanan Perangkat &amp; Komputer Bersama:
              </p>
              <p>{SMART_LOGIN_SECURITY_NOTICE}</p>
            </div>
          </div>

          {/* Target Application Selector (if opened from global manager without fixed targetApp) */}
          {!targetApp && applications.length > 0 && (
            <div>
              <label
                htmlFor="smartlogin-app-select"
                className="block text-xs font-bold text-[#0F172A] mb-1.5"
              >
                Pilih Aplikasi Kerja
              </label>
              <select
                id="smartlogin-app-select"
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#0F766E]"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.url})
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetApp && (
            <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#0F172A] truncate">{targetApp.name}</p>
                <p className="text-[11px] font-mono text-[#64748B] truncate">{targetApp.url}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#14B8A6]/30 text-[11px] font-bold shrink-0">
                <Lock className="w-3 h-3" />
                <span>Lokal Terenkripsi</span>
              </span>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label
              htmlFor="smartlogin-username-input"
              className="block text-xs font-bold text-[#0F172A] mb-1.5"
            >
              Username / NIP / Email Login
            </label>
            <input
              id="smartlogin-username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username, NIP, atau email akun aplikasi..."
              autoComplete="off"
              data-testid="smartlogin-username-input"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] focus:border-[#0F766E] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="smartlogin-password-input"
              className="block text-xs font-bold text-[#0F172A] mb-1.5"
            >
              Password Akun
            </label>
            <div className="relative">
              <input
                id="smartlogin-password-input"
                type={showPasswordInput ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isUpdatingExisting
                    ? 'Masukkan password baru untuk aplikasi ini...'
                    : 'Masukkan password akun aplikasi...'
                }
                autoComplete="new-password"
                data-testid="smartlogin-password-input"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] focus:border-[#0F766E] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
              />
              <button
                type="button"
                onClick={() => setShowPasswordInput((prev) => !prev)}
                aria-label={showPasswordInput ? 'Sembunyikan ketikan password' : 'Lihat ketikan password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              Password dienkripsi secara lokal (Electron safeStorage / AES-256-GCM) dan tidak pernah
              dikirim ke Firebase atau server mana pun.
            </p>
          </div>

          {/* Autofill Toggle */}
          <label className="flex items-start gap-3 p-3 rounded-2xl bg-[#F0FDFA]/80 border border-[#14B8A6]/30 cursor-pointer">
            <input
              type="checkbox"
              checked={autofillEnabled}
              onChange={(e) => setAutofillEnabled(e.target.checked)}
              className="mt-0.5 rounded border-teal-300 text-[#0F766E] focus:ring-[#0F766E]"
            />
            <div className="text-xs">
              <span className="font-bold text-[#064E3B] block">
                Aktifkan Autofill Login Otomatis
              </span>
              <span className="text-[#475569] text-[11px]">
                Mengisi kolom username &amp; password secara otomatis pada form login yang
                kompatibel tanpa menekan tombol Login secara otomatis.
              </span>
            </div>
          </label>

          {/* Explicit Shared-Computer Consent Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={deviceConfirmed}
              onChange={(e) => setDeviceConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
            />
            <span className="text-[11px] text-[#334155] leading-relaxed">
              Saya menyetujui penyimpanan kredensial terenkripsi secara lokal hanya pada komputer
              ini dan memahami bahwa akun tidak tersinkronisasi otomatis ke komputer lain.
            </span>
          </label>

          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDontSave}
              disabled={submitting}
              data-testid="smartlogin-modal-dont-save-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-bold transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-slate-500" />
              <span>Jangan Simpan Akun</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={submitting}
                data-testid="smartlogin-modal-save-btn"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simpan Akun pada Perangkat Ini</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
