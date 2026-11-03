import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { useToast } from '../../components/common/ToastContext';
import { CategoryFormInput, CategoryItem } from '../../types';
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from '../../components/brand/CategoryIcon';
import {
  createCategory,
  deleteCategory,
  initializeStandardCategories,
  toggleCategoryActiveStatus,
  updateCategory,
} from '../../services/portalService';

export function AdminCategoriesPage() {
  const { allCategories, allApplications, loadingAdmin } = usePortal();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState<CategoryFormInput>({
    name: '',
    description: '',
    icon: 'heart-pulse',
    displayOrder: 1,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const appCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const app of allApplications) {
      counts.set(app.categoryId, (counts.get(app.categoryId) || 0) + 1);
    }
    return counts;
  }, [allApplications]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormError(null);
    const nextOrder =
      allCategories.length > 0
        ? Math.max(...allCategories.map((c) => c.displayOrder || 0)) + 1
        : 1;
    setFormData({
      name: '',
      description: '',
      icon: 'heart-pulse',
      displayOrder: nextOrder,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormError(null);
    setFormData({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
    });
    setModalOpen(true);
  };

  const handleSeedStandard = async () => {
    setSeeding(true);
    try {
      const addedCount = await initializeStandardCategories(allCategories.map((c) => c.id));
      showToast({
        type: 'success',
        title: 'Kategori Standar Dimuat',
        description:
          addedCount > 0
            ? `${addedCount} kategori standar Puskesmas berhasil disimpan ke database.`
            : 'Seluruh 8 kategori standar sudah ada di database.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Kategori',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory, formData);
        showToast({
          type: 'success',
          title: 'Kategori Diperbarui',
          description: `Kategori "${formData.name}" berhasil diperbarui.`,
        });
      } else {
        await createCategory(formData);
        showToast({
          type: 'success',
          title: 'Kategori Ditambahkan',
          description: `Kategori "${formData.name}" berhasil disimpan ke database.`,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan kategori.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat: CategoryItem) => {
    try {
      const next = !cat.isActive;
      await toggleCategoryActiveStatus(cat, next);
      showToast({
        type: 'success',
        title: next ? 'Kategori Diaktifkan' : 'Kategori Dinonaktifkan',
        description: `"${cat.name}" kini berstatus ${next ? 'Aktif' : 'Nonaktif'}.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Mengubah Status',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    }
  };

  const handleMoveOrder = async (cat: CategoryItem, delta: number) => {
    const nextOrder = Math.max(0, Math.min(10000, (cat.displayOrder || 0) + delta));
    if (nextOrder === cat.displayOrder) return;
    try {
      await updateCategory(cat, {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        displayOrder: nextOrder,
        isActive: cat.isActive,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Mengubah Urutan',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setDeletingBusy(true);
    try {
      const name = deletingCategory.name;
      await deleteCategory(deletingCategory);
      showToast({
        type: 'success',
        title: 'Kategori Dihapus',
        description: `Kategori "${name}" berhasil dihapus.`,
      });
      setDeletingCategory(null);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Kategori',
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
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">Kategori Aplikasi</h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Kelola kategori dinamis yang digunakan untuk mengelompokkan aplikasi Puskesmas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedStandard}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Muat 8 Kategori Standar</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {loadingAdmin ? (
          <div className="p-12 text-center">
            <Loader2 className="w-7 h-7 text-[#0F766E] animate-spin mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-[#64748B]">Memuat kategori aplikasi...</p>
          </div>
        ) : allCategories.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-bold text-[#0F172A]">
              Belum ada kategori tersimpan di database.
            </p>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-md mx-auto">
              Tekan tombol <strong>Muat 8 Kategori Standar</strong> untuk membuat kategori resmi
              Puskesmas (Kemenkes, Dinkes, Pemda, Administrasi, Kesling, Program Kesehatan,
              Pelaporan, Aplikasi Internal) atau buat kategori baru secara manual.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSeedStandard}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#0D9488] transition-colors cursor-pointer"
              >
                {seeding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Muat 8 Kategori Standar Puskesmas</span>
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Manual</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Urutan</th>
                  <th className="py-3.5 px-4">Nama Kategori</th>
                  <th className="py-3.5 px-4">Deskripsi</th>
                  <th className="py-3.5 px-4">Jumlah Aplikasi</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {allCategories.map((cat) => {
                  const linkedApps = appCountByCategory.get(cat.id) || 0;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <span className="w-7 text-center font-mono font-bold text-[#0F172A] tabular-nums">
                            {cat.displayOrder}
                          </span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(cat, -1)}
                              aria-label={`Naikkan urutan ${cat.name}`}
                              className="p-0.5 text-slate-400 hover:text-[#0F766E] cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(cat, 1)}
                              aria-label={`Turunkan urutan ${cat.name}`}
                              className="p-0.5 text-slate-400 hover:text-[#0F766E] cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#F0FDFA] border border-[#14B8A6]/30 text-[#0F766E] flex items-center justify-center shrink-0">
                            <CategoryIcon icon={cat.icon} className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-[#0F172A]">{cat.name}</p>
                            <p className="text-[11px] font-mono text-slate-400">ID: {cat.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#64748B] max-w-xs">
                        <p className="line-clamp-2">{cat.description || '—'}</p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[#0F172A] tabular-nums">
                        {linkedApps} aplikasi
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            cat.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              cat.isActive ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          />
                          <span>{cat.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            aria-label={`Edit kategori ${cat.name}`}
                            className="p-2 rounded-lg text-slate-600 hover:text-[#0F766E] hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(cat)}
                            aria-label={`Hapus kategori ${cat.name}`}
                            className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cat-modal-title"
        >
          <div className="bg-white rounded-3xl border border-[#E2E8F0] max-w-lg w-full p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <h3 id="cat-modal-title" className="text-lg font-extrabold text-[#0F172A]">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup modal kategori"
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

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="cat-name-input"
                  className="block text-xs font-bold text-[#0F172A] mb-1"
                >
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cat-name-input"
                  type="text"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Kementerian Kesehatan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div>
                <label
                  htmlFor="cat-icon-select"
                  className="block text-xs font-bold text-[#0F172A] mb-1"
                >
                  Simbol / Ikon Kategori
                </label>
                <select
                  id="cat-icon-select"
                  value={formData.icon}
                  onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:border-[#14B8A6]"
                >
                  {CATEGORY_ICON_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="cat-desc-input"
                  className="block text-xs font-bold text-[#0F172A] mb-1"
                >
                  Deskripsi Kategori
                </label>
                <textarea
                  id="cat-desc-input"
                  rows={2}
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Keterangan singkat jenis aplikasi dalam kategori ini..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cat-order-input"
                    className="block text-xs font-bold text-[#0F172A] mb-1"
                  >
                    Urutan Tampilan
                  </label>
                  <input
                    id="cat-order-input"
                    type="number"
                    min={0}
                    max={10000}
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayOrder: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-sm tabular-nums focus:outline-none focus:border-[#14B8A6]"
                  />
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
                  <span>Simpan Kategori</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation */}
      {deletingCategory && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-cat-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-cat-title" className="text-base font-bold text-[#0F172A]">
                  Hapus Kategori &ldquo;{deletingCategory.name}&rdquo;?
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  {(appCountByCategory.get(deletingCategory.id) || 0) > 0
                    ? `Terdapat ${appCountByCategory.get(deletingCategory.id)} aplikasi pada kategori ini. Pastikan Anda memindahkan kategori aplikasi tersebut terlebih dahulu.`
                    : 'Kategori ini akan dihapus dari database.'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
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
                <span>Ya, Hapus Kategori</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
