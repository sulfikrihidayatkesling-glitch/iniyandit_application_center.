import React, { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Code2,
  ExternalLink,
  FolderKanban,
  Home,
  LayoutGrid,
  Loader2,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { useToast } from '../components/common/ToastContext';
import { IniyanditLogo } from '../components/brand/IniyanditLogo';

const ADMIN_NAV_ITEMS = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: Home,
  },
  {
    to: '/admin/applications',
    label: 'Manajemen Aplikasi',
    icon: LayoutGrid,
  },
  {
    to: '/admin/categories',
    label: 'Kategori Aplikasi',
    icon: FolderKanban,
  },
  {
    to: '/admin/users',
    label: 'Manajemen Admin',
    icon: Users,
  },
  {
    to: '/admin/statistics',
    label: 'Statistik',
    icon: BarChart3,
  },
  {
    to: '/admin/settings',
    label: 'Pengaturan',
    icon: Settings,
  },
];

export function AdminLayout() {
  const { user, authReady, isAdmin, adminRole, adminChecking, logoutAdmin, settings } = usePortal();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (!authReady || adminChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="mb-4">
          <IniyanditLogo variant="square" size={56} />
        </div>
        <Loader2 className="w-7 h-7 text-[#0F766E] animate-spin mb-2.5" />
        <p className="text-sm font-semibold text-[#0F172A]">
          Memverifikasi sesi &amp; otorisasi Administrator...
        </p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  const currentNav = ADMIN_NAV_ITEMS.find((item) => location.pathname.startsWith(item.to));
  const pageTitle = currentNav?.label || 'Dashboard Admin';

  const handleLogout = async () => {
    await logoutAdmin();
    showToast({
      type: 'info',
      title: 'Berhasil Logout',
      description: 'Anda telah keluar dari sesi Administrator.',
    });
    navigate('/admin/login', { replace: true });
  };

  const renderSidebarContent = (onItemClick?: () => void) => (
    <div className="flex flex-col h-full bg-linear-to-b from-[#073B37] via-[#0B524C] to-[#083B38] text-white select-none">
      {/* Sidebar Brand Header */}
      <div className="p-5 border-b border-white/10">
        <IniyanditLogo
          variant="sidebar"
          size={42}
          portalName={settings.portalName}
          institutionName={settings.institutionName}
          customLogoUrl={settings.logoUrl}
        />
      </div>

      {/* Sidebar Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto" aria-label="Menu Admin">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-linear-to-r from-[#14B8A6] to-[#0F766E] text-white shadow-sm'
                    : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Portal Preview, Logout & Developer Credit */}
      <div className="p-3.5 border-t border-white/10 space-y-1.5">
        <Link
          to="/"
          onClick={onItemClick}
          className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-teal-100/85 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span>Lihat Portal Petugas</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-200 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>

        {/* Official Designer & Developer Credit in Admin Sidebar Footer */}
        <div className="pt-2.5 mt-1 border-t border-white/10 px-3 py-2 rounded-xl bg-white/5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-200/80 uppercase tracking-wider">
            <Code2 className="w-3 h-3 text-[#A3E635] shrink-0" />
            <span>Application Designer &amp; Developer</span>
          </div>
          <p className="text-xs font-bold text-white mt-0.5 truncate">
            Sulfikri Hidayat, S.Tr.Kes.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A]">
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-68 shrink-0 sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Tutup menu navigasi"
              className="absolute top-4 right-3 p-1.5 rounded-lg text-teal-100 hover:bg-white/10 z-20"
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent(() => setMobileDrawerOpen(false))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Buka menu navigasi admin"
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F766E] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-extrabold text-[#0F172A] truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {(user.displayName || user.email || 'A')[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#0F172A] max-w-[160px] truncate">
                    {user.displayName || 'Administrator'}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                </div>
                <p className="text-[11px] text-[#64748B] max-w-[200px] truncate">
                  {adminRole === 'super_admin' ? 'Super Admin' : 'Admin'} · {user.email}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
