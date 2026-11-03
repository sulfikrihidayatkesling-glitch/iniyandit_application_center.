import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit3,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { useToast } from '../../components/common/ToastContext';
import { ApplicationFormInput, ApplicationItem } from '../../types';
import { ApplicationLogoBadge } from '../../components/brand/CategoryIcon';
import {
  createApplication,
  deleteApplication,
  initializeStandardCategories,
  toggleApplicationActiveStatus,
  updateApplication,
} from '../../services/portalService';
import { uploadLogoImage } from '../../services/storageService';
import { EXTERNAL_ANCHOR_PROPS, handleExternalAppClick } from '../../utils/externalLauncher';

export function AdminApplicationsPage() {
  const { allApplications, allCategories, loadingAdmin } = usePortal();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add/Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationItem | null>(null);
  const [formData, setFormData] = useState<ApplicationFormInput>({
    name: '',
    url: '',
    logoUrl: '',
    categoryId: '',
    description: '',
    isActive: true,
    displayOrder: 1,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seedingCategories, setSeedingCategories] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Delete Confirmation Modal State
  const [deletingApp, setDeletingApp] = useState<ApplicationItem | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    for (const c of allCategories) {
      map.set(c.id, { name: c.name, icon: c.icon });
    }
    return map;
  }, [allCategories]);

  // Open modal automatically if ?action=new is in URL
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const openCreateModal = () => {
    setEditingApp(null);
    setFormError(null);
    const nextOrder =
      allApplications.length > 0
        ? Math.max(...allApplications.map((a) => a.displayOrder || 0)) + 1
        : 1;
    setFormData({
      name: '',
      url: '',
      logoUrl: '',
      categoryId: allCategories[0]?.id || '',
      description: '',
      isActive: true,
      displayOrder: nextOrder,
    });
    setModalOpen(true);
  };

  const openEditModal = (app: ApplicationItem) => {
    setEditingApp(app);
    setFormError(null);
    setFormData({
      name: app.name,
      url: app.url,
      logoUrl: app.logoUrl,
      categoryId: app.categoryId,
      description: app.description,
      isActive: app.isActive,
      displayOrder: app.displayOrder,
    });
    setModalOpen(true);
  };

  const handleSeedDefaultCategories = async () => {
    setSeedingCategories(true);
    try {
      const count = await initializeStandardCategories(allCategories.map((c) => c.id));
      showToast({
        type: 'success',
        title: 'Kategori Standar Tersedia',
        description: `${count} kategori standar berhasil dimuat.`,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal memuat kategori standar.');
    } finally {
      setSeedingCategories(false);
    }
  };

  // Auto-select first category when categories load while modal is open
  useEffect(() => {
    if (modalOpen && !formData.categoryId && allCategories.length > 0) {
      setFormData((prev) => ({ ...prev, categoryId: allCategories[0].id }));
    }
  }, [modalOpen, formData.categoryId, allCategories]);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setUploadingLogo(true);
    try {
      const result = await uploadLogoImage(file, 'applications');
      setFormData((prev) => ({ ...prev, logoUrl: result.url }));
      showToast({
        type: 'success',
        title: 'Logo Siap Digunakan',
        description: 'Logo aplikasi berhasil diproses dan siap disimpan.',
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengunggah logo.');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (allCategories.length === 0) {
      setFormError(
        'Belum ada kategori di database. Klik tombol "Muat 8 Kategori Standar" terlebih dahulu.'
      );
      return;
    }

    setSaving(true);
    try {
      if (editingApp) {
        await updateApplication(editingApp, formData);
        showToast({
          type: 'success',
          title: 'Aplikasi Diperbarui',
          description: `Perubahan pada "${formData.name}" berhasil disimpan.`,
        });
      } else {
        await createApplication(formData);
        showToast({
          type: 'success',
          title: 'Aplikasi Ditambahkan',
          description: `"${formData.name}" berhasil disimpan dan langsung aktif di dashboard petugas.`,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan aplikasi.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (app: ApplicationItem) => {
    try {
      const next = !app.isActive;
      await toggleApplicationActiveStatus(app, next);
      showToast({
        type: 'success',
        title: next ? 'Aplikasi Diaktifkan' : 'Aplikasi Dinonaktifkan',
        description: next
          ? `"${app.name}" kini ditampilkan pada dashboard petugas.`
          : `"${app.name}" disembunyikan dari dashboard petugas.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Mengubah Status',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    }
  };

  const handleMoveOrder = async (app: ApplicationItem, delta: number) => {
    const nextOrder = Math.max(0, Math.min(10000, (app.displayOrder || 0) + delta));
    if (nextOrder === app.displayOrder) return;
    try {
      await updateApplication(app, {
        name: app.name,
        url: app.url,
        logoUrl: app.logoUrl,
        categoryId: app.categoryId,
        description: app.description,
        isActive: app.isActive,
        displayOrder: nextOrder,
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
    if (!deletingApp) return;
    setDeletingBusy(true);
    try {
      const targetName = deletingApp.name;
      await deleteApplication(deletingApp);
      showToast({
        type: 'success',
        title: 'Aplikasi Dihapus',
        description: `"${targetName}" telah dihapus dari portal.`,
      });
      setDeletingApp(null);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Aplikasi',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    } finally {
      setDeletingBusy(false);
    }
  };

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allApplications.filter((app) => {
      if (categoryFilter !== 'all' && app.categoryId !== categoryFilter) return false;
      if (statusFilter === 'active' && !app.isActive) return false;
      if (statusFilter === 'inactive' && app.isActive) return false;
      if (!q) return true;
      const catName = categoryMap.get(app.categoryId)?.name.toLowerCase() || '';
      return (
        app.name.toLowerCase().includes(q) ||
        app.url.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        catName.includes(q)
      );
    });
  }, [allApplications, searchQuery, categoryFilter, statusFilter, categoryMap]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">Manajemen Aplikasi</h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Tambah, ubah logo, atur URL, kategori, urutan tampilan, dan status aktif aplikasi.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Aplikasi</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#0F766E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama aplikasi, URL, atau deskripsi..."
            aria-label="Cari aplikasi di tabel admin"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm focus:outline-none focus:border-[#14B8A6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter berdasarkan kategori"
            className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#14B8A6]"
          >
            <option value="all">Semua Kategori</option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            aria-label="Filter berdasarkan status"
            className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#14B8A6]"
          >
            <option value="all">Semua Status</option>
            <option value="active">Status Aktif</option>
            <option value="inactive">Status Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Applications Table / List */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {loadingAdmin ? (
          <div className="p-12 text-center">
            <Loader2 className="w-7 h-7 text-[#0F766E] animate-spin mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-[#64748B]">Memuat data aplikasi...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-bold text-[#0F172A]">Belum ada aplikasi tersedia.</p>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-md mx-auto">
              Tekan tombol <strong>+ Tambah Aplikasi</strong> di kanan atas untuk menambahkan
              aplikasi baru ke portal Puskesmas Iniyandit.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#0D9488] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Aplikasi</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/80 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Urutan</th>
                  <th className="py-3.5 px-4">Aplikasi</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">URL Tujuan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredApps.map((app) => {
                  const cat = categoryMap.get(app.categoryId);
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order Controls */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <span className="w-7 text-center font-mono font-bold text-[#0F172A] tabular-nums">
                            {app.displayOrder}
                          </span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(app, -1)}
                              aria-label={`Naikkan urutan ${app.name}`}
                              className="p-0.5 text-slate-400 hover:text-[#0F766E] cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(app, 1)}
                              aria-label={`Turunkan urutan ${app.name}`}
                              className="p-0.5 text-slate-400 hover:text-[#0F766E] cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* App Logo, Name & Description */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <ApplicationLogoBadge
                            name={app.name}
                            logoUrl={app.logoUrl}
                            categoryIcon={cat?.icon}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[#0F172A] truncate max-w-[240px]">
                              {app.name}
                            </p>
                            <p className="text-xs text-[#64748B] truncate max-w-[260px]">
                              {app.description || 'Tanpa deskripsi tambahan'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-semibold text-[#475569]">
                        {cat?.name || app.categoryId}
                      </td>

                      {/* URL */}
                      <td className="py-3.5 px-4">
                        <a
                          href={app.url}
                          target={EXTERNAL_ANCHOR_PROPS.target}
                          rel={EXTERNAL_ANCHOR_PROPS.rel}
                          onClick={(e) => handleExternalAppClick(e, app.url)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#0F766E] hover:underline max-w-[220px] truncate"
                        >
                          <span className="truncate">{app.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>

                      {/* Active Toggle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(app)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            app.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              app.isActive ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          />
                          <span>{app.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(app)}
                            aria-label={`Edit ${app.name}`}
                            className="p-2 rounded-lg text-slate-600 hover:text-[#0F766E] hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingApp(app)}
                            aria-label={`Hapus ${app.name}`}
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

      {/* Add / Edit Application Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-modal-title"
        >
          <div className="bg-white rounded-3xl border border-[#E2E8F0] max-w-xl w-full p-6 sm:p-7 shadow-2xl my-8">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 id="app-modal-title" className="text-lg font-extrabold text-[#0F172A]">
                  {editingApp ? 'Edit Aplikasi' : 'Tambah Aplikasi Baru'}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Aplikasi dengan status Aktif akan langsung muncul pada dashboard petugas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup form aplikasi"
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

            {/* Prompt to initialize categories if database has 0 categories */}
            {allCategories.length === 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-teal-50/80 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-teal-900">
                  <p className="font-bold">Belum Ada Kategori di Database</p>
                  <p className="mt-0.5">
                    Muat 8 kategori standar Puskesmas (Kemenkes, Dinkes, Pemda, Kesling, dll) agar
                    dapat dipilih.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSeedDefaultCategories}
                  disabled={seedingCategories}
                  className="px-3.5 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold shrink-0 hover:bg-[#0D9488] cursor-pointer inline-flex items-center gap-1.5"
                >
                  {seedingCategories ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Muat 8 Kategori Standar</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSaveApplication} className="mt-5 space-y-4">
              {/* Logo Upload & Preview Row */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <ApplicationLogoBadge
                  name={formData.name || 'Aplikasi'}
                  logoUrl={formData.logoUrl}
                  categoryIcon={categoryMap.get(formData.categoryId)?.icon}
                  size="lg"
                />
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-[#0F172A]">Logo Aplikasi</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Mendukung PNG, JPG, JPEG, atau WebP (rasio proporsional object-fit: contain).
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleLogoFileChange}
                      className="hidden"
                      id="app-logo-upload-input"
                    />
                    <label
                      htmlFor="app-logo-upload-input"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-semibold text-[#0F766E] shadow-2xs cursor-pointer"
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengunggah...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Logo</span>
                        </>
                      )}
                    </label>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nama Aplikasi & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="app-name-input"
                    className="block text-xs font-bold text-[#0F172A] mb-1"
                  >
                    Nama Aplikasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="app-name-input"
                    type="text"
                    required
                    maxLength={120}
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: SatuSehat / ASIK / e-Puskesmas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="app-category-select"
                    className="block text-xs font-bold text-[#0F172A] mb-1"
                  >
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="app-category-select"
                    required
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, categoryId: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:border-[#14B8A6]"
                  >
                    <option value="" disabled>
                      -- Pilih Kategori --
                    </option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {!cat.isActive ? '(Nonaktif)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* URL Aplikasi */}
              <div>
                <label
                  htmlFor="app-url-input"
                  className="block text-xs font-bold text-[#0F172A] mb-1"
                >
                  URL Aplikasi <span className="text-rose-500">*</span>
                </label>
                <input
                  id="app-url-input"
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://satusehat.kemkes.go.id"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              {/* Deskripsi Singkat */}
              <div>
                <label
                  htmlFor="app-desc-input"
                  className="block text-xs font-bold text-[#0F172A] mb-1"
                >
                  Deskripsi Singkat
                </label>
                <textarea
                  id="app-desc-input"
                  rows={2}
                  maxLength={600}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Jelaskan fungsi singkat aplikasi bagi petugas Puskesmas..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              {/* Urutan Tampilan & Status Aktif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label
                    htmlFor="app-order-input"
                    className="block text-xs font-bold text-[#0F172A] mb-1"
                  >
                    Urutan Tampilan
                  </label>
                  <input
                    id="app-order-input"
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
                      Status Aktif (Tampilkan ke Petugas)
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingLogo}
                  className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Aplikasi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingApp && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-app-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-app-title" className="text-base font-bold text-[#0F172A]">
                  Hapus Aplikasi &ldquo;{deletingApp.name}&rdquo;?
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Tindakan ini akan menghapus aplikasi secara permanen dari portal Iniyandit
                  Application Center.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingApp(null)}
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
                <span>Ya, Hapus Aplikasi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
