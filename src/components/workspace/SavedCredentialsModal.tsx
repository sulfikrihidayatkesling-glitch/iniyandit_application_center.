import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { ApplicationItem } from '../../types';
import { SmartLoginCredentialMeta } from '../../utils/desktopWorkspace';
import { SMART_LOGIN_SECURITY_NOTICE } from '../../utils/smartLogin';
import { ApplicationLogoBadge } from '../brand/CategoryIcon';

interface SavedCredentialsModalProps {
  open: boolean;
  credentials: SmartLoginCredentialMeta[];
  applications: ApplicationItem[];
  categoryMap: Map<string, { name: string; icon: string }>;
  isElectronRuntime: boolean;
  onClose: () => void;
  onOpenSaveModal: (app: ApplicationItem | null, existingUsername?: string, isUpdate?: boolean) => void;
  onToggleAutofill: (appId: string, enabled: boolean) => Promise<void>;
  onDeleteCredential: (appId: string, appName: string) => Promise<void>;
  onClearAllCredentials: () => Promise<void>;
}

export function SavedCredentialsModal({
  open,
  credentials,
  applications,
  categoryMap,
  isElectronRuntime,
  onClose,
  onOpenSaveModal,
  onToggleAutofill,
  onDeleteCredential,
  onClearAllCredentials,
}: SavedCredentialsModalProps) {
  const [confirmDeleteAppId, setConfirmDeleteAppId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  if (!open) return null;

  const savedList = credentials.filter((c) => c.policy === 'saved');
  const neverSaveList = credentials.filter((c) => c.policy === 'never_save');

  const appLookup = new Map<string, ApplicationItem>();
  for (const app of applications) {
    appLookup.set(app.id, app);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-credentials-manager-title"
      data-testid="saved-credentials-modal"
    >
      <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="bg-linear-to-r from-[#064E3B] via-[#0F766E] to-[#0D9488] px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                id="saved-credentials-manager-title"
                className="text-base sm:text-lg font-extrabold"
              >
                Pengelola Akun Tersimpan — Iniyandit Smart Login
              </h2>
              <p className="text-xs text-teal-100">
                Credential Assistant Lokal Terenkripsi • UPTD Puskesmas Iniyandit
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pengelola Akun Tersimpan"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Mandatory Security Warning & Local Device Isolation Notice */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200/90 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1 leading-relaxed">
              <p className="font-extrabold text-amber-950">Informasi Keamanan Pengguna:</p>
              <p>{SMART_LOGIN_SECURITY_NOTICE}</p>
              <p className="text-[11px] text-amber-800 pt-1">
                • <strong>Penyimpanan Lokal Per Komputer:</strong> Kredensial dienkripsi menggunakan{' '}
                {isElectronRuntime
                  ? 'Electron safeStorage (OS DPAPI) + AES-256-GCM'
                  : 'Web Crypto API AES-256-GCM'}{' '}
                hanya pada perangkat ini, tidak pernah disimpan di Firebase/Firestore, dan tidak
                otomatis tersedia pada komputer lain.
              </p>
            </div>
          </div>

          {/* Action Bar: Add Account + Clear All */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#0F172A]">
                Daftar Aplikasi dengan Akun Tersimpan ({savedList.length})
              </h3>
              <p className="text-xs text-[#64748B]">
                Password disembunyikan secara permanen demi keamanan petugas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenSaveModal(null)}
                data-testid="manager-add-credential-btn"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Akun Baru</span>
              </button>

              {credentials.length > 0 && !confirmClearAll && (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  data-testid="manager-clear-all-btn"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua Akun pada Perangkat Ini</span>
                </button>
              )}
            </div>
          </div>

          {/* Confirmation Banner for Clear All */}
          {confirmClearAll && (
            <div
              className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex flex-wrap items-center justify-between gap-3"
              data-testid="confirm-clear-all-banner"
            >
              <div className="text-xs text-rose-900">
                <p className="font-extrabold">
                  Konfirmasi Penghapusan Seluruh Kredensial pada Perangkat Ini
                </p>
                <p className="mt-0.5">
                  Apakah Anda yakin ingin menghapus seluruh akun dan password yang tersimpan di
                  komputer ini? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onClearAllCredentials();
                    setConfirmClearAll(false);
                  }}
                  data-testid="confirm-clear-all-yes-btn"
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  Ya, Hapus Semua Akun
                </button>
              </div>
            </div>
          )}

          {/* Saved Accounts Table / List */}
          {savedList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F0FDFA] border border-[#14B8A6]/30 text-[#0F766E] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#0F172A]">
                Belum ada akun yang disimpan pada perangkat ini.
              </p>
              <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                Petugas dapat menyimpan akun dan password secara opsional saat membuka aplikasi
                kerja, atau menekan tombol <strong>Simpan Akun Baru</strong> di atas.
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="saved-credentials-list">
              {savedList.map((cred) => {
                const appObj = appLookup.get(cred.appId) || {
                  id: cred.appId,
                  name: cred.appName || cred.appId,
                  url: cred.appUrl,
                  logoUrl: '',
                  categoryId: '',
                  description: '',
                  isActive: true,
                  displayOrder: 1,
                  openCount: 0,
                  createdAt: null,
                  updatedAt: null,
                  createdBy: '',
                };
                const catInfo = categoryMap.get(appObj.categoryId);
                const isConfirmingDelete = confirmDeleteAppId === cred.appId;

                return (
                  <div
                    key={cred.appId}
                    data-testid={`saved-credential-row-${cred.appId}`}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <ApplicationLogoBadge
                        name={appObj.name}
                        logoUrl={appObj.logoUrl}
                        categoryIcon={catInfo?.icon}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-extrabold text-[#0F172A] truncate">
                            {appObj.name}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              cred.autofillEnabled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {cred.autofillEnabled ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Autofill Aktif</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-slate-400" />
                                <span>Autofill Nonaktif</span>
                              </>
                            )}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#475569]">
                          <span className="inline-flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                            <span>Username:</span>
                            <strong className="text-[#0F172A] font-mono">{cred.username}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-[#0F766E]" />
                            <span>Password:</span>
                            <span className="font-mono tracking-widest text-slate-400 select-none">
                              ••••••••••••
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row Controls: Toggle Autofill, Change Account, Delete Account */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleAutofill(cred.appId, !cred.autofillEnabled)}
                        data-testid={`toggle-autofill-btn-${cred.appId}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          cred.autofillEnabled
                            ? 'bg-[#F0FDFA] text-[#0F766E] border-[#14B8A6]/40 hover:bg-teal-100/70'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {cred.autofillEnabled ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-[#0F766E]" />
                            <span>Nonaktifkan Autofill</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-500" />
                            <span>Aktifkan Autofill</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenSaveModal(appObj, cred.username, true)}
                        data-testid={`change-credential-btn-${cred.appId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Ganti Akun</span>
                      </button>

                      {!isConfirmingDelete ? (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAppId(cred.appId)}
                          data-testid={`delete-credential-btn-${cred.appId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Akun</span>
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1">
                          <span className="text-[11px] font-bold text-rose-800">Hapus?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteCredential(cred.appId, appObj.name);
                              setConfirmDeleteAppId(null);
                            }}
                            data-testid={`confirm-delete-credential-yes-${cred.appId}`}
                            className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteAppId(null)}
                            className="px-2 py-0.5 rounded-lg bg-white text-slate-600 border border-slate-200 text-[11px] font-semibold cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List of Applications where User Explicitly Selected "Jangan Simpan" */}
          {neverSaveList.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#64748B] mb-2.5">
                Aplikasi dengan Preferensi &ldquo;Jangan Simpan Akun&rdquo; ({neverSaveList.length})
              </h4>
              <div className="space-y-2">
                {neverSaveList.map((item) => {
                  const appObj = appLookup.get(item.appId);
                  return (
                    <div
                      key={item.appId}
                      className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-[#0F172A]">
                          {appObj?.name || item.appName || item.appId}
                        </span>
                        <span className="text-[#64748B]">• Tidak menyimpan kredensial</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {appObj && (
                          <button
                            type="button"
                            onClick={() => onOpenSaveModal(appObj, '', false)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 text-[#0F766E] border border-teal-200 font-bold cursor-pointer"
                          >
                            Ubah ke Simpan Akun
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteCredential(
                              item.appId,
                              appObj?.name || item.appName || item.appId
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-semibold cursor-pointer"
                        >
                          Reset Pilihan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B] shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
            <span>Terenkripsi secara lokal pada komputer ini</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white font-bold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
