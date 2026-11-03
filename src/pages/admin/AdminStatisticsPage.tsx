import React, { useMemo } from 'react';
import { BarChart3, CheckCircle2, Clock, FolderKanban, LayoutGrid, XCircle } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { CategoryIcon } from '../../components/brand/CategoryIcon';

function formatTimestamp(val: unknown): string {
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function AdminStatisticsPage() {
  const { allApplications, allCategories, adminsList, activityLogs } = usePortal();

  const stats = useMemo(() => {
    const totalApps = allApplications.length;
    const activeApps = allApplications.filter((a) => a.isActive).length;
    const inactiveApps = totalApps - activeApps;
    const activeRatio = totalApps > 0 ? Math.round((activeApps / totalApps) * 100) : 0;

    const categoryBreakdown = allCategories.map((cat) => {
      const appsInCat = allApplications.filter((a) => a.categoryId === cat.id);
      const activeInCat = appsInCat.filter((a) => a.isActive).length;
      return {
        category: cat,
        total: appsInCat.length,
        active: activeInCat,
        inactive: appsInCat.length - activeInCat,
        percentage: totalApps > 0 ? Math.round((appsInCat.length / totalApps) * 100) : 0,
      };
    });

    return {
      totalApps,
      activeApps,
      inactiveApps,
      activeRatio,
      totalCategories: allCategories.length,
      activeCategories: allCategories.filter((c) => c.isActive).length,
      totalAdmins: Math.max(1, adminsList.length),
      categoryBreakdown,
    };
  }, [allApplications, allCategories, adminsList]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
          Statistik &amp; Riwayat Aktivitas Portal
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Data analitik aktual berdasarkan database Cloud Firestore UPTD Puskesmas Iniyandit.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between text-[#0F766E] mb-2">
            <span className="text-xs font-bold text-[#64748B]">Total Aplikasi</span>
            <LayoutGrid className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums">
            {stats.totalApps}
          </p>
          <p className="text-xs text-[#64748B] mt-1 tabular-nums">
            Rasio Aktif: {stats.activeRatio}%
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold text-[#64748B]">Aplikasi Aktif</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums">
            {stats.activeApps}
          </p>
          <p className="text-xs text-emerald-700 mt-1">Tampil di dashboard petugas</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold text-[#64748B]">Aplikasi Nonaktif</span>
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums">
            {stats.inactiveApps}
          </p>
          <p className="text-xs text-slate-500 mt-1">Disembunyikan dari publik</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between text-[#0F766E] mb-2">
            <span className="text-xs font-bold text-[#64748B]">Kategori Aktif</span>
            <FolderKanban className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums">
            {stats.activeCategories} / {stats.totalCategories}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {stats.totalAdmins} Administrator terdaftar
          </p>
        </div>
      </div>

      {/* Category Distribution & Complete Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Distribution */}
        <section className="lg:col-span-6 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <BarChart3 className="w-5 h-5 text-[#0F766E]" />
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Distribusi Aplikasi per Kategori
              </h3>
              <p className="text-xs text-[#64748B]">
                Jumlah aplikasi aktif dan nonaktif pada setiap kategori
              </p>
            </div>
          </div>

          {stats.categoryBreakdown.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-[#0F172A]">Belum ada kategori terdaftar.</p>
              <p className="text-xs text-[#64748B] mt-1">
                Tambahkan atau muat kategori pada menu Kategori Aplikasi.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {stats.categoryBreakdown.map(({ category, total, active, inactive, percentage }) => (
                <div key={category.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
                      <CategoryIcon icon={category.icon} className="w-4 h-4 text-[#0F766E]" />
                      <span>{category.name}</span>
                    </div>
                    <div className="text-xs text-[#64748B] tabular-nums">
                      <span className="font-bold text-[#0F172A]">{total}</span> aplikasi ({active}{' '}
                      aktif{inactive > 0 ? `, ${inactive} nonaktif` : ''})
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0F766E] transition-all duration-300"
                      style={{ width: `${Math.max(total > 0 ? 8 : 0, percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Audit Trail */}
        <section className="lg:col-span-6 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Clock className="w-5 h-5 text-[#0F766E]" />
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Log Aktivitas Administrator</h3>
              <p className="text-xs text-[#64748B]">
                Rekam jejak perubahan aplikasi, kategori, dan pengaturan
              </p>
            </div>
          </div>

          {activityLogs.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-[#0F172A]">Belum ada catatan aktivitas.</p>
              <p className="text-xs text-[#64748B] mt-1">
                Aktivitas pengelolaan akan tampil secara kronologis di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 mt-2 max-h-[420px] overflow-y-auto pr-1">
              {activityLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-[#0F172A]">{log.action}</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5 tabular-nums">
                      Oleh {log.actorName} · {formatTimestamp(log.createdAt)}
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
