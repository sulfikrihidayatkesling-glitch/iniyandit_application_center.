import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  Home,
  KeyRound,
  LayoutGrid,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCw,
  Search,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { ApplicationItem } from '../../types';
import {
  IniyanditDesktopBridge,
  SmartLoginAutofillResult,
  SmartLoginCredentialMeta,
  WorkspaceTab,
  computeWorkspaceViewportBounds,
} from '../../utils/desktopWorkspace';
import { getAppSmartLoginState } from '../../utils/smartLogin';
import { ApplicationLogoBadge } from '../brand/CategoryIcon';

interface InternalBrowserWorkspaceProps {
  tabs: WorkspaceTab[];
  activeTab: WorkspaceTab;
  applications: ApplicationItem[];
  categoryMap: Map<string, { name: string; icon: string }>;
  desktopBridge: IniyanditDesktopBridge | null;
  overlayModalOpen: boolean;
  isFullScreen: boolean;
  credentials: SmartLoginCredentialMeta[];
  lastAutofillResult: SmartLoginAutofillResult | null;
  onSelectDashboard: () => void;
  onOpenApplication: (app: ApplicationItem) => void;
  onNavigateTab: (tabId: string, action: 'back' | 'forward' | 'reload' | 'home') => void;
  onMarkTabLoaded: (tabId: string) => void;
  onToggleTabErrorView: (tabId: string, showError: boolean, reason?: string) => void;
  onDismissCompatibilityNotice: (tabId: string) => void;
  onOpenExternalBrowser: (url: string) => void;
  onToggleFullScreen: () => void;
  onExitFullScreen: () => void;
  onOpenSaveCredentialModal: (
    app: ApplicationItem,
    existingUsername?: string,
    isUpdate?: boolean
  ) => void;
  onDontSaveCredential: (app: ApplicationItem) => Promise<void>;
  onToggleAutofill: (appId: string, enabled: boolean) => Promise<void>;
  onDeleteCredential: (appId: string, appName: string) => Promise<void>;
  onTriggerAutofill: (tab: WorkspaceTab) => Promise<void>;
  onOpenCredentialsManager: () => void;
  onCopyUsername: (username: string, appName: string) => void;
}

export function InternalBrowserWorkspace({
  tabs,
  activeTab,
  applications,
  categoryMap,
  desktopBridge,
  overlayModalOpen,
  isFullScreen,
  credentials,
  lastAutofillResult,
  onSelectDashboard,
  onOpenApplication,
  onNavigateTab,
  onMarkTabLoaded,
  onToggleTabErrorView,
  onDismissCompatibilityNotice,
  onOpenExternalBrowser,
  onToggleFullScreen,
  onExitFullScreen,
  onOpenSaveCredentialModal,
  onDontSaveCredential,
  onToggleAutofill,
  onDeleteCredential,
  onTriggerAutofill,
  onOpenCredentialsManager,
  onCopyUsername,
}: InternalBrowserWorkspaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [confirmDeleteActive, setConfirmDeleteActive] = useState(false);
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);

  const openAppIds = useMemo(() => new Set(tabs.map((t) => t.appId)), [tabs]);
  const savedAppIds = useMemo(
    () => new Set(credentials.filter((c) => c.policy === 'saved').map((c) => c.appId)),
    [credentials]
  );

  const currentAppObject = useMemo<ApplicationItem>(() => {
    const found = applications.find((a) => a.id === activeTab.appId);
    if (found) return found;
    return {
      id: activeTab.appId,
      name: activeTab.title,
      url: activeTab.initialUrl,
      logoUrl: activeTab.logoUrl,
      categoryId: activeTab.categoryId,
      description: '',
      isActive: true,
      displayOrder: 1,
      openCount: 0,
      createdAt: null,
      updatedAt: null,
      createdBy: '',
    };
  }, [applications, activeTab]);

  const smartLoginState = useMemo(
    () => getAppSmartLoginState(credentials, activeTab.appId),
    [credentials, activeTab.appId]
  );

  useEffect(() => {
    setConfirmDeleteActive(false);
  }, [activeTab.appId]);

  const filteredSidebarApps = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((app) => {
      const catName = categoryMap.get(app.categoryId)?.name.toLowerCase() || '';
      return (
        app.name.toLowerCase().includes(q) ||
        catName.includes(q) ||
        (app.description || '').toLowerCase().includes(q)
      );
    });
  }, [applications, sidebarSearch, categoryMap]);

  // Synchronize WebContentsView bounds when running inside Electron Desktop
  useEffect(() => {
    if (!desktopBridge) return;

    const syncBounds = () => {
      const el = viewportContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const targetBounds = computeWorkspaceViewportBounds({
        isFullScreen,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        containerRect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
      });
      desktopBridge.setBounds(targetBounds);
    };

    syncBounds();

    const observer = new ResizeObserver(() => {
      syncBounds();
    });

    if (viewportContainerRef.current) {
      observer.observe(viewportContainerRef.current);
    }

    window.addEventListener('resize', syncBounds);
    window.addEventListener('scroll', syncBounds, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncBounds);
      window.removeEventListener('scroll', syncBounds, true);
    };
  }, [
    desktopBridge,
    sidebarOpen,
    isFullScreen,
    activeTab.tabId,
    activeTab.hasError,
    smartLoginState.status,
    lastAutofillResult,
  ]);

  // Hide native WebContentsView if error screen or modal overlay is active
  useEffect(() => {
    if (!desktopBridge) return;
    desktopBridge.setOverlayVisible(overlayModalOpen || activeTab.hasError);
  }, [desktopBridge, overlayModalOpen, activeTab.hasError]);

  // Auto-complete loading indicator after reasonable timeout in web preview mode
  useEffect(() => {
    if (desktopBridge || !activeTab.isLoading) return;
    const timer = window.setTimeout(() => {
      onMarkTabLoaded(activeTab.tabId);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [desktopBridge, activeTab.tabId, activeTab.isLoading, activeTab.reloadKey, onMarkTabLoaded]);

  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;

  return (
    <div
      className={
        isFullScreen
          ? 'fixed inset-0 w-screen h-screen z-50 flex flex-col bg-white overflow-hidden'
          : 'flex-1 flex flex-col bg-[#F1F5F9] min-h-[calc(100vh-116px)]'
      }
      data-testid="internal-browser-workspace"
      data-fullscreen={isFullScreen ? 'true' : 'false'}
    >
      {/* Floating Full Screen Exit Control (Visible only in Full Screen Mode) */}
      {isFullScreen && (
        <div
          className="fixed top-3 right-3 z-60 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900/95 text-white border border-teal-400/45 shadow-lg backdrop-blur-md transition-opacity opacity-85 hover:opacity-100"
          data-testid="workspace-fullscreen-floating-bar"
        >
          <span className="text-[11px] font-bold text-teal-200 px-1.5 truncate max-w-[160px] hidden sm:inline">
            {activeTab.title}
          </span>
          <button
            type="button"
            onClick={onExitFullScreen}
            title="Keluar dari Mode Layar Penuh (Esc / F11 / Ctrl+Shift+F)"
            aria-label="Keluar dari Full Screen"
            data-testid="workspace-exit-fullscreen-btn"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F766E] hover:bg-[#0D9488] text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5 shrink-0" />
            <span>⛶ Keluar Full Screen (Esc)</span>
          </button>
        </div>
      )}

      {/* Internal Browser Navigation Toolbar (Hidden when Full Screen is active) */}
      {!isFullScreen && (
        <div
          className="bg-white border-b border-[#E2E8F0] px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs z-20"
          data-testid="workspace-toolbar"
        >
          {/* Left Controls: Sidebar Toggle + Back to Dashboard + Browser Nav */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              title={sidebarOpen ? 'Sembunyikan Sidebar Aplikasi' : 'Tampilkan Sidebar Aplikasi'}
              aria-label="Toggle Sidebar Aplikasi"
              className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-slate-200/70 text-[#0F766E] border border-[#E2E8F0] transition-colors cursor-pointer"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onSelectDashboard}
              data-testid="workspace-back-to-dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0FDFA] hover:bg-teal-100/80 text-[#0F766E] border border-[#14B8A6]/35 text-xs font-bold transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kembali ke Dashboard</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Back */}
            <button
              type="button"
              onClick={() => onNavigateTab(activeTab.tabId, 'back')}
              disabled={!desktopBridge && !canGoBack}
              title="Halaman Sebelumnya (Kembali)"
              aria-label="Kembali"
              data-testid="workspace-nav-back"
              className="p-2 rounded-xl text-[#0F172A] hover:bg-slate-100 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Forward */}
            <button
              type="button"
              onClick={() => onNavigateTab(activeTab.tabId, 'forward')}
              disabled={!desktopBridge && !canGoForward}
              title="Halaman Berikutnya (Maju)"
              aria-label="Maju"
              data-testid="workspace-nav-forward"
              className="p-2 rounded-xl text-[#0F172A] hover:bg-slate-100 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Reload / Refresh */}
            <button
              type="button"
              onClick={() => onNavigateTab(activeTab.tabId, 'reload')}
              title="Muat Ulang Aplikasi (Refresh)"
              aria-label="Refresh"
              data-testid="workspace-nav-reload"
              className="p-2 rounded-xl text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCw
                className={`w-4 h-4 ${activeTab.isLoading ? 'animate-spin text-[#0F766E]' : ''}`}
              />
            </button>

            {/* Application Home (Initial URL) */}
            <button
              type="button"
              onClick={() => onNavigateTab(activeTab.tabId, 'home')}
              title="Beranda Awal Aplikasi"
              aria-label="Beranda Aplikasi"
              data-testid="workspace-nav-home"
              className="p-2 rounded-xl text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Center Address / Security Bar */}
          <div className="flex-1 min-w-[200px] max-w-xl mx-1">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
              <Lock className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
              <span className="font-bold text-[#0F766E] shrink-0 hidden md:inline">
                {activeTab.title}
              </span>
              <span className="text-slate-300 hidden md:inline">|</span>
              <span
                className="font-mono text-[11px] text-[#475569] truncate flex-1 select-all"
                data-testid="workspace-address-url"
              >
                {activeTab.currentUrl}
              </span>
              {activeTab.isLoading && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Memuat...</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Controls: Smart Login + Compatibility + External Browser + Full Screen (⛶) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenCredentialsManager}
              title="Pengelola Akun Tersimpan (Smart Login)"
              data-testid="workspace-open-credentials-manager-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0FDFA] hover:bg-teal-100/80 text-[#0F766E] border border-[#14B8A6]/40 text-xs font-bold transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">Pengelola Akun</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onToggleTabErrorView(
                  activeTab.tabId,
                  !activeTab.hasError,
                  'Website menerapkan kebijakan keamanan header (X-Frame-Options / Content-Security-Policy) atau autentikasi khusus yang membatasi pemuatan pada mode pratinjau web.'
                )
              }
              title="Diagnostik Kompatibilitas Website"
              data-testid="workspace-compatibility-btn"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                activeTab.hasError
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-[#475569] border-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden lg:inline">Kendala Tampilan?</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenExternalBrowser(activeTab.currentUrl)}
              title="Buka di Browser Eksternal (Fallback Kompatibilitas)"
              data-testid="workspace-open-external-fallback"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <span className="hidden md:inline">Buka di Browser Eksternal</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* Tombol Full Screen (⛶) di Kanan Atas Toolbar Aplikasi Internal */}
            <button
              type="button"
              onClick={onToggleFullScreen}
              title="Mode Layar Penuh / Full Screen (F11 / Ctrl+Shift+F)"
              aria-label="Mode Full Screen"
              data-testid="workspace-fullscreen-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0FDFA] hover:bg-teal-100 text-[#0F766E] border border-[#14B8A6]/45 text-xs font-extrabold shadow-2xs transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 shrink-0" />
              <span>⛶ Full Screen</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Progress Bar (Hidden when Full Screen is active) */}
      {!isFullScreen && activeTab.isLoading && (
        <div className="h-0.5 w-full bg-teal-100 overflow-hidden">
          <div className="h-full w-1/2 bg-linear-to-r from-[#0F766E] via-[#14B8A6] to-[#84CC16] animate-pulse" />
        </div>
      )}

      {/* Main Split Workspace: Left Application Launcher Sidebar + Right Content Viewport */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Collapsible Sidebar Daftar Aplikasi (Hidden in Full Screen mode) */}
        {!isFullScreen && sidebarOpen && (
          <aside
            className="w-64 sm:w-72 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 select-none z-10"
            aria-label="Sidebar Daftar Aplikasi"
            data-testid="workspace-app-sidebar"
          >
            <div className="p-3.5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E]">
                  Daftar Aplikasi ({applications.length})
                </span>
                <span className="text-[11px] font-semibold text-[#64748B]">Klik untuk buka</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#0F766E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Cari aplikasi di sidebar..."
                  aria-label="Cari aplikasi di sidebar"
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#14B8A6]"
                />
                {sidebarSearch && (
                  <button
                    type="button"
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {filteredSidebarApps.map((app) => {
                const isCurrentApp = activeTab.appId === app.id;
                const isOpenInTab = openAppIds.has(app.id);
                const hasSavedCred = savedAppIds.has(app.id);
                const catInfo = categoryMap.get(app.categoryId);

                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => onOpenApplication(app)}
                    data-testid={`sidebar-app-${app.id}`}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isCurrentApp
                        ? 'bg-[#F0FDFA] border border-[#14B8A6] shadow-2xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <ApplicationLogoBadge
                      name={app.name}
                      logoUrl={app.logoUrl}
                      categoryIcon={catInfo?.icon}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs font-bold truncate ${
                            isCurrentApp ? 'text-[#0F766E]' : 'text-[#0F172A]'
                          }`}
                        >
                          {app.name}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasSavedCred && (
                            <KeyRound
                              className="w-3 h-3 text-[#0F766E]"
                              aria-label="Akun tersimpan"
                            />
                          )}
                          {isOpenInTab && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#16A34A]"
                              title="Sedang terbuka di tab"
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate">
                        {catInfo?.name || app.categoryId}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-100 bg-[#F8FAFC] space-y-2">
              <button
                type="button"
                onClick={onOpenCredentialsManager}
                className="w-full py-2 px-3 rounded-xl bg-[#F0FDFA] hover:bg-teal-100/70 text-[#0F766E] border border-[#14B8A6]/35 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Pengelola Akun Tersimpan</span>
              </button>
              <button
                type="button"
                onClick={onSelectDashboard}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-teal-50 text-[#0F766E] border border-[#CBD5E1] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lihat Seluruh Dashboard</span>
              </button>
            </div>
          </aside>
        )}

        {/* Right Content Area for Opened Application */}
        <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
          {/* Smart Login Credential Assistant Banner (Hidden in Full Screen mode) */}
          {!isFullScreen && smartLoginState.status === 'ask' && (
            <div
              className="bg-linear-to-r from-[#064E3B] via-[#0F766E] to-[#0D9488] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-10 shadow-xs"
              data-testid="smartlogin-prompt-banner"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-extrabold">
                    Apakah Anda ingin menyimpan akun {activeTab.title} untuk mempermudah login
                    berikutnya?
                  </span>
                  <span className="hidden xl:inline text-teal-100 ml-2">
                    (Opsional • Dienkripsi secara lokal pada perangkat ini)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenSaveCredentialModal(currentAppObject, '', false)}
                  data-testid="workspace-smartlogin-save-btn"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-[#064E3B] font-extrabold shadow-2xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Simpan Akun</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDontSaveCredential(currentAppObject)}
                  data-testid="workspace-smartlogin-dont-save-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Jangan Simpan</span>
                </button>
              </div>
            </div>
          )}

          {!isFullScreen && smartLoginState.status === 'saved' && smartLoginState.record && (
            <div
              className="bg-[#F0FDFA] border-b border-[#14B8A6]/35 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs z-10"
              data-testid="smartlogin-saved-bar"
            >
              <div className="flex flex-wrap items-center gap-2.5 text-[#064E3B]">
                <span className="inline-flex items-center gap-1.5 font-extrabold">
                  <KeyRound className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Smart Login {activeTab.title}:</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-teal-200 font-mono text-[11px] font-bold text-[#0F172A]">
                  <UserCheck className="w-3 h-3 text-[#0F766E]" />
                  <span>{smartLoginState.record.username}</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onCopyUsername(smartLoginState.record!.username, activeTab.title)
                  }
                  title="Salin Username untuk Login Manual"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-teal-50 text-[#0F766E] border border-teal-200 text-[11px] font-bold cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Salin Username</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onTriggerAutofill(activeTab)}
                  data-testid="workspace-smartlogin-autofill-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white font-bold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Isi Otomatis (Autofill)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onToggleAutofill(
                      activeTab.appId,
                      !smartLoginState.record!.autofillEnabled
                    )
                  }
                  data-testid="workspace-smartlogin-toggle-autofill-btn"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-teal-200 font-bold cursor-pointer"
                >
                  {smartLoginState.record.autofillEnabled ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-[#0F766E]" />
                      <span>Autofill: Aktif</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-400" />
                      <span>Autofill: Nonaktif</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onOpenSaveCredentialModal(
                      currentAppObject,
                      smartLoginState.record!.username,
                      true
                    )
                  }
                  data-testid="workspace-smartlogin-change-btn"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-200 font-bold cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-[#0F766E]" />
                  <span>Ganti Akun</span>
                </button>

                {!confirmDeleteActive ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteActive(true)}
                    data-testid="workspace-smartlogin-delete-btn"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus Akun</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-xl px-2 py-0.5">
                    <span className="text-[11px] font-bold text-rose-800">Hapus?</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await onDeleteCredential(activeTab.appId, activeTab.title);
                        setConfirmDeleteActive(false);
                      }}
                      data-testid="workspace-smartlogin-confirm-delete-yes"
                      className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteActive(false)}
                      className="px-2 py-0.5 rounded-lg bg-white text-slate-600 border border-slate-200 text-[11px] cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isFullScreen && smartLoginState.status === 'never_save' && (
            <div
              className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 z-10"
              data-testid="smartlogin-never-save-bar"
            >
              <span>
                Status Smart Login <strong>{activeTab.title}</strong>: Anda memilih{' '}
                <strong>Jangan simpan akun dan password</strong> pada perangkat ini.
              </span>
              <button
                type="button"
                onClick={() => onOpenSaveCredentialModal(currentAppObject, '', false)}
                className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-teal-50 text-[#0F766E] border border-slate-200 font-bold cursor-pointer"
              >
                Simpan Akun untuk Aplikasi Ini
              </button>
            </div>
          )}

          {/* Autofill Compatibility Feedback Banner (Hidden in Full Screen mode) */}
          {!isFullScreen && lastAutofillResult && lastAutofillResult.appId === activeTab.appId && (
            <div
              className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs z-10 ${
                lastAutofillResult.status === 'autofilled'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
              data-testid="smartlogin-autofill-feedback"
            >
              <div className="flex items-center gap-2">
                {lastAutofillResult.status === 'autofilled' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{lastAutofillResult.message}</span>
              </div>

              {lastAutofillResult.status !== 'autofilled' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenExternalBrowser(activeTab.currentUrl)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 text-[11px] font-bold cursor-pointer"
                  >
                    Buka Login Manual
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Viewport Container */}
          <div
            ref={viewportContainerRef}
            className="flex-1 flex flex-col bg-white relative overflow-hidden w-full h-full"
            data-testid="workspace-content-viewport"
          >
            {/* Compatibility Notice Banner (Hidden in Full Screen mode) */}
            {!isFullScreen &&
              !desktopBridge &&
              !activeTab.compatibilityNoticeDismissed &&
              !activeTab.hasError && (
                <div className="bg-linear-to-r from-[#F0FDFA] via-teal-50/90 to-[#ECFDF5] border-b border-[#14B8A6]/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs z-10">
                  <div className="flex items-center gap-2 text-[#064E3B]">
                    <Sparkles className="w-4 h-4 text-[#0F766E] shrink-0" />
                    <span>
                      <strong>Mode Jendela Internal Aktif:</strong> Menampilkan{' '}
                      <strong>{activeTab.title}</strong> di dalam Iniyandit Application Center. Jika
                      website tujuan membatasi tampilan karena kebijakan keamanan
                      (CSP/X-Frame-Options), klik <strong>Kendala Tampilan?</strong> di atas.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDismissCompatibilityNotice(activeTab.tabId)}
                      className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-[#0F766E] border border-teal-200 text-[11px] font-bold cursor-pointer"
                    >
                      Sembunyikan Info
                    </button>
                  </div>
                </div>
              )}

            {/* Error / Website Compatibility Fallback Screen */}
            {activeTab.hasError ? (
              <div
                className="flex-1 flex items-center justify-center p-6 bg-[#F8FAFC]"
                data-testid="workspace-error-fallback-view"
              >
                <div className="max-w-lg w-full bg-white rounded-3xl border border-[#E2E8F0] p-7 sm:p-8 text-center shadow-lg">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8" />
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
                    Proteksi Keamanan / Kompatibilitas Website Eksternal
                  </span>

                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] mt-3">
                    {activeTab.title} Memerlukan Penanganan Kompatibilitas
                  </h3>

                  <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">
                    {activeTab.errorDescription ||
                      'Website tujuan menerapkan kebijakan keamanan ketat (Content-Security-Policy, X-Frame-Options, atau sesi autentikasi SSO khusus) yang menolak ditampilkan secara langsung pada mode ini.'}
                  </p>

                  <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-left text-xs text-[#334155] space-y-1.5">
                    <p className="font-bold text-[#0F172A]">Detail Teknis &amp; Solusi:</p>
                    <p>
                      • <strong>URL Tujuan:</strong>{' '}
                      <code className="font-mono text-[11px] text-[#0F766E] break-all">
                        {activeTab.currentUrl}
                      </code>
                    </p>
                    <p>
                      • Pada versi <strong>Installer Windows (.exe)</strong> berbasis Electron{' '}
                      <code>WebContentsView</code>, halaman dirender sebagai{' '}
                      <em>top-level view</em> mandiri di dalam jendela aplikasi beserta fitur{' '}
                      <strong>Smart Login Autofill</strong> dan <strong>Full Screen</strong>.
                    </p>
                    <p>
                      • Apabila server tujuan tetap memerlukan autentikasi sertifikat/token browser
                      eksternal, klik tombol <strong>Buka di Browser Eksternal</strong> di bawah.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onToggleTabErrorView(activeTab.tabId, false);
                        onNavigateTab(activeTab.tabId, 'reload');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>Coba Muat Ulang di Dalam Aplikasi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenExternalBrowser(activeTab.currentUrl)}
                      data-testid="error-view-open-external-btn"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <span>Buka di Browser Eksternal</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : desktopBridge ? (
              /* Native Electron WebContentsView Placeholder Surface */
              <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] text-center p-6">
                <Loader2 className="w-7 h-7 text-[#0F766E] animate-spin mb-2" />
                <p className="text-xs font-bold text-[#0F172A]">
                  Menampilkan {activeTab.title} melalui Electron WebContentsView...
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                  {activeTab.currentUrl}
                </p>
              </div>
            ) : (
              /* Multi-Tab Internal Browser Surface for Web Environment */
              <div
                className={`flex-1 relative w-full h-full ${
                  isFullScreen ? 'min-h-screen' : 'min-h-[540px]'
                }`}
              >
                {tabs.map((tab) => {
                  const isCurrent = tab.tabId === activeTab.tabId;
                  return (
                    <iframe
                      key={`${tab.tabId}-${tab.reloadKey}`}
                      src={tab.currentUrl}
                      title={`Workspace Internal — ${tab.title}`}
                      onLoad={() => onMarkTabLoaded(tab.tabId)}
                      onError={() =>
                        onToggleTabErrorView(
                          tab.tabId,
                          true,
                          'Website gagal dimuat atau menolak koneksi di dalam jendela aplikasi.'
                        )
                      }
                      className={`w-full h-full border-0 bg-white ${
                        isCurrent
                          ? isFullScreen
                            ? 'block min-h-screen'
                            : 'block min-h-[540px]'
                          : 'hidden'
                      }`}
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
