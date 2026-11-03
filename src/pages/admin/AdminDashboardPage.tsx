import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckSquare,
  Clock,
  ExternalLink,
  FolderKanban,
  LayoutGrid,
  Loader2,
  Plus,
  Sparkles,
  XSquare,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { useToast } from '../../components/common/ToastContext';
import { ApplicationLogoBadge } from '../../components/brand/CategoryIcon';
import { initializeStandardCategories } from '../../services/portalService';
import { EXTERNAL_ANCHOR_PROPS, handleExternalAppClick } from '../../utils/externalLauncher';

function formatLogTime(val: unknown): string {
  if (!val) return 'Baru saja';
  let date: Date | null = null;
  if (
    typeof val === 'object' &&
    val !== null &&
    'toDate' in val &&
    typeof (val as { toDate: () => Date }).toDate === 'function'
  ) {
    date = (val as { toDate: () => Date }).toDate();
  } else if (val instanceof Date) {
    date = val;
  } else if (typeof val === 'string') {
    const parsed = new Date(val);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }
  if (!date) return 'Baru saja';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function AdminDashboardPage() {
  const { allApplications, allCategories, activityLogs, loadingAdmin } = usePortal();
  const { showToast } = useToast();
  const [seedingCategories, setSeedingCategories] = useState(false);

  const stats = useMemo(() => {
    const totalApps = allApplications.length;
    const totalCategories = allCategories.length;
    const activeApps = allApplications.filter((a) => a.isActive).length;
    const inactiveApps = totalApps - activeApps;
    return { totalApps, totalCategories, activeApps, inactiveApps };
  }, [allApplications, allCategories]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    for (const cat of allCategories) {
      map.set(cat.id, { name: cat.name, icon: cat.icon });
    }
    return map;
  }, [allCategories]);

  const handleSeedCategories = async () => {
    setSeedingCategories(true);
    try {
      const count = await initializeStandardCategories(allCategories.map((c) => c.id));
      showToast({
        type: 'success',
        title: 'Kategori Standar Siap',
        description:
          count > 0
            ? `${count} kategori standar Puskesmas berhasil disimpan ke database.`
            : 'Seluruh kategori standar sudah tersedia di database.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Kategori',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    } finally {
      setSeedingCategories(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0]">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
            Ringkasan Portal Iniyandit Application Center
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Data aktual real-time dari Cloud Firestore UPTD Puskesmas Iniyandit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {allCategories.length === 0 && (
            <button
              type="button"
              onClick={handleSeedCategories}
              disabled={seedingCategories}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0F766E] border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
            >
              {seedingCategories ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Inisialisasi 8 Kategori Standar</span>
            </button>
          )}
          <Link
            to="/admin/applications?action=new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Aplikasi</span>
          </Link>
        </div>
      </div>

      {/* 4 Actual Statistic Cards (Matching Reference UI) */}
      <section aria-label="Statistik Portal" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Aplikasi */}
        <div className="rounded-2xl bg-[#E0F2FE]/60 border border-sky-200/80 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-xs">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Total Aplikasi</p>
            <p
              className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5"
              data-testid="stat-total-apps"
            >
              {loadingAdmin ? '—' : stats.totalApps}
            </p>
          </div>
        </div>

        {/* Card 2: Total Kategori */}
        <div className="rounded-2xl bg-[#DCFCE7]/65 border border-emerald-200/80 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center shrink-0 shadow-xs">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Total Kategori</p>
            <p
              className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5"
              data-testid="stat-total-categories"
            >
              {loadingAdmin ? '—' : stats.totalCategories}
            </p>
          </div>
        </div>

        {/* Card 3: Aplikasi Aktif */}
        <div className="rounded-2xl bg-[#DBEAFE]/65 border border-blue-200/80 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Aplikasi Aktif</p>
            <p
              className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5"
              data-testid="stat-active-apps"
            >
              {loadingAdmin ? '—' : stats.activeApps}
            </p>
          </div>
        </div>

        {/* Card 4: Aplikasi Nonaktif */}
        <div className="rounded-2xl bg-[#FEE2E2]/65 border border-rose-200/80 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-xs">
            <XSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-800">Aplikasi Nonaktif</p>
            <p
              className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5"
              data-testid="stat-inactive-apps"
            >
              {loadingAdmin ? '—' : stats.inactiveApps}
            </p>
          </div>
        </div>
      </section>

      {/* Two-Column Content: Applications Overview & Latest Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Daftar Aplikasi Terkini */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Daftar Aplikasi Portal</h3>
              <p className="text-xs text-[#64748B]">
                Urutan aplikasi yang tampil pada dashboard petugas
              </p>
            </div>
            <Link
              to="/admin/applications"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline"
            >
              <span>Kelola Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {allApplications.length === 0 ? (
            <div className="py-10 text-center my-auto">
              <p className="text-sm font-semibold text-[#0F172A]">Belum ada aplikasi tersedia.</p>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Tambahkan aplikasi kerja Puskesmas beserta logo dan URL melalui menu Manajemen
                Aplikasi.
              </p>
              <Link
                to="/admin/applications?action=new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#0D9488] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Aplikasi Pertama</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 mt-2">
              {allApplications.slice(0, 6).map((app, index) => {
                const cat = categoryMap.get(app.categoryId);
                return (
                  <div
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-xs font-bold text-slate-400 tabular-nums">
                        {index + 1}
                      </span>
                      <ApplicationLogoBadge
                        name={app.name}
                        logoUrl={app.logoUrl}
                        categoryIcon={cat?.icon}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0F172A] truncate">{app.name}</p>
                        <p className="text-xs text-[#64748B] truncate">
                          {cat?.name || app.categoryId} ·{' '}
                          <span
                            className={
                              app.isActive
                                ? 'text-emerald-700 font-semibold'
                                : 'text-rose-600 font-semibold'
                            }
                          >
                            {app.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <a
                      href={app.url}
                      target={EXTERNAL_ANCHOR_PROPS.target}
                      rel={EXTERNAL_ANCHOR_PROPS.rel}
                      onClick={(e) => handleExternalAppClick(e, app.url)}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#0F766E] hover:bg-teal-50 transition-colors shrink-0"
                      title={`Buka ${app.name}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Aktivitas Terakhir (Real Audit Logs) */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Aktivitas Terakhir</h3>
              <p className="text-xs text-[#64748B]">Catatan aktivitas aktual pengelolaan portal</p>
            </div>
            <Link
              to="/admin/statistics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activityLogs.length === 0 ? (
            <div className="py-10 text-center my-auto">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">Belum ada riwayat aktivitas.</p>
              <p className="text-xs text-[#64748B] mt-1">
                Setiap penambahan atau perubahan aplikasi dan kategori akan tercatat secara otomatis
                di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 mt-2">
              {activityLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0FDFA] border border-[#14B8A6]/30 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-[#0F172A] leading-snug">
                      {log.action}
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5 tabular-nums">
                      {log.actorName} · {formatLogTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
