import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Edit3,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { useToast } from '../../components/common/ToastContext';
import { AdminRole, AdminUserFormInput, AdminUserItem } from '../../types';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../../utils/validation';
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
} from '../../services/portalService';

export function AdminUsersPage() {
  const { user, adminsList, loadingAdmin } = usePortal();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUserItem | null>(null);
  const [formData, setFormData] = useState<AdminUserFormInput>({
    uid: '',
    name: '',
    email: '',
    role: 'admin',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingAdmin, setDeletingAdmin] = useState<AdminUserItem | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormError(null);
    setFormData({
      uid: '',
      name: '',
      email: '',
      role: 'admin',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (adminItem: AdminUserItem) => {
    setEditingAdmin(adminItem);
    setFormError(null);
    setFormData({
      uid: adminItem.uid,
      name: adminItem.name,
      email: adminItem.email,
      role: adminItem.role,
      isActive: adminItem.isActive,
    });
    setModalOpen(true);
  };

  const handleCopyCurrentUid = async () => {
    if (!user?.uid) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      showToast({
        type: 'info',
        title: 'UID Disalin',
        description: `UID ${user.uid} disalin ke clipboard.`,
      });
    } catch {
      // Fallback
    }
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (editingAdmin) {
        await updateAdminUser(editingAdmin, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
        });
        showToast({
          type: 'success',
          title: 'Data Admin Diperbarui',
          description: `Kewenangan "${formData.name}" berhasil disimpan.`,
        });
      } else {
        await createAdminUser(formData);
        showToast({
          type: 'success',
          title: 'Administrator Ditambahkan',
          description: `"${formData.name}" kini memiliki otorisasi Admin portal.`,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data administrator.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (adminItem: AdminUserItem) => {
    if (adminItem.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
      showToast({
        type: 'error',
        title: 'Aksi Dibatasi',
        description: 'Akun Super Admin Utama tidak dapat dinonaktifkan.',
      });
      return;
    }

    try {
      const next = !adminItem.isActive;
      await updateAdminUser(adminItem, {
        name: adminItem.name,
        email: adminItem.email,
        role: adminItem.role,
        isActive: next,
      });
      showToast({
        type: 'success',
        title: next ? 'Admin Diaktifkan' : 'Admin Dinonaktifkan',
        description: `Akses "${adminItem.name}" berhasil diperbarui.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Mengubah Status Admin',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAdmin) return;
    setDeletingBusy(true);
    try {
      await deleteAdminUser(deletingAdmin);
      showToast({
        type: 'success',
        title: 'Administrator Dihapus',
        description: `Otorisasi "${deletingAdmin.name}" telah dicabut.`,
      });
      setDeletingAdmin(null);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Admin',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">Manajemen Admin</h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Kelola daftar administrator yang memiliki hak akses mengelola aplikasi dan kategori.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Admin</span>
        </button>
      </div>

      {/* Security Architecture Info Banner */}
      <div className="bg-[#F0FDFA] rounded-2xl border border-[#14B8A6]/30 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <p className="font-bold text-[#0F172A]">
              Keamanan Otorisasi Berbasis UID &amp; Firestore Security Rules
            </p>
            <p className="mt-0.5">
              Portal ini tidak menyediakan registrasi publik. Untuk menambahkan Administrator baru,
              buat akun di <strong>Firebase Authentication</strong> (atau minta calon admin login
              sekali untuk melihat UID-nya), lalu daftarkan <strong>Firebase Auth UID</strong>{' '}
              beserta email terverifikasinya pada daftar di bawah.
            </p>
          </div>
        </div>
        {user && (
          <button
            type="button"
            onClick={handleCopyCurrentUid}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-teal-200 text-xs font-semibold text-[#0F766E] hover:bg-teal-50 shrink-0 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>UID Anda: {user.uid.slice(0, 10)}...</span>
          </button>
        )}
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {loadingAdmin ? (
          <div className="p-12 text-center">
            <Loader2 className="w-7 h-7 text-[#0F766E] animate-spin mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-[#64748B]">Memuat daftar administrator...</p>
          </div>
        ) : adminsList.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-8 h-8 text-[#0F766E] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#0F172A]">
              Akun Super Admin Utama ({BOOTSTRAPPED_ADMIN_EMAIL}) Aktif
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Tambahkan rekan administrator lain menggunakan tombol + Tambah Admin di kanan atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nama Administrator</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Firebase UID</th>
                  <th className="py-3.5 px-4">Kewenangan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {adminsList.map((adm) => {
                  const isPrimarySuperAdmin =
                    adm.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
                  return (
                    <tr key={adm.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {(adm.name || adm.email || 'A')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p>{adm.name}</p>
                            {isPrimarySuperAdmin && (
                              <span className="text-[10px] font-semibold text-[#0F766E]">
                                Bootstrapped Super Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">{adm.email}</td>

                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{adm.uid}</td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-[#0F172A]">
                        {adm.role === 'super_admin' ? 'Super Admin' : 'Admin Portal'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(adm)}
                          disabled={isPrimarySuperAdmin}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                            isPrimarySuperAdmin
                              ? 'bg-emerald-50 text-emerald-700 cursor-default'
                              : adm.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              adm.isActive ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          />
                          <span>{adm.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(adm)}
                            aria-label={`Edit admin ${adm.name}`}
                            className="p-2 rounded-lg text-slate-600 hover:text-[#0F766E] hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!isPrimarySuperAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeletingAdmin(adm)}
                              aria-label={`Hapus admin ${adm.name}`}
                              className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Admin Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-modal-title"
        >
          <div className="bg-white rounded-3xl border border-[#E2E8F0] max-w-lg w-full p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <h3 id="admin-modal-title" className="text-lg font-extrabold text-[#0F172A]">
                {editingAdmin ? 'Edit Kewenangan Admin' : 'Tambah Administrator Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup modal admin"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveAdmin} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="admin-uid-input"
                  className="block text-xs font-bold text-[#0F172A] mb-1"
                >
                  Firebase Auth UID <span className="text-rose-500">*</span>
                </label>
                <input
                  id="admin-uid-input"
                  type="text"
                  required
                  disabled={Boolean(editingAdmin)}
                  value={formData.uid}
                  onChange={(e) => setFormData((prev) => ({ ...prev, uid: e.target.value }))}
                  placeholder="Masukkan User UID dari Firebase Authentication"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-mono disabled:bg-slate-100 focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-name-input"
                  className="block text-xs font-bold text-[#0F172A] mb-1"
                >
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  id="admin-name-input"
                  type="text"
                  required
                  maxLength={120}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Petugas Pengelola Sistem Informasi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-email-field"
                  className="block text-xs font-bold text-[#0F172A] mb-1"
                >
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="admin-email-field"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="nama@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="admin-role-select"
                    className="block text-xs font-bold text-[#0F172A] mb-1"
                  >
                    Kewenangan (Role)
                  </label>
                  <select
                    id="admin-role-select"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, role: e.target.value as AdminRole }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:border-[#14B8A6]"
                  >
                    <option value="admin">Admin Portal</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                      }
                      className="w-4 h-4 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                      Status Aktif
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Administrator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Admin Confirmation */}
      {deletingAdmin && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-admin-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-admin-title" className="text-base font-bold text-[#0F172A]">
                  Cabut Akses &ldquo;{deletingAdmin.name}&rdquo;?
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Pengguna dengan email {deletingAdmin.email} tidak akan dapat mengakses halaman
                  pengelolaan Admin lagi.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingAdmin(null)}
                disabled={deletingBusy}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingBusy}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {deletingBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Cabut Akses</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
