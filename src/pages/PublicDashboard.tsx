import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  FolderOpen,
  Heart,
  Info,
  KeyRound,
  LayoutGrid,
  Monitor,
  Search,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { useToast } from '../components/common/ToastContext';
import { IniyanditLogo } from '../components/brand/IniyanditLogo';
import { ApplicationLogoBadge, CategoryIcon } from '../components/brand/CategoryIcon';
import { AboutModal } from '../components/common/AboutModal';
import { WorkspaceTabBar } from '../components/workspace/WorkspaceTabBar';
import { InternalBrowserWorkspace } from '../components/workspace/InternalBrowserWorkspace';
import { SmartLoginSaveModal } from '../components/workspace/SmartLoginSaveModal';
import { SavedCredentialsModal } from '../components/workspace/SavedCredentialsModal';
import { ApplicationItem } from '../types';
import { filterAndSortApplications } from '../utils/validation';
import {
  SmartLoginAutofillResult,
  SmartLoginCredentialMeta,
  WorkspaceTab,
  closeWorkspaceTab,
  evaluateFullScreenShortcut,
  getDesktopBridge,
  navigateWorkspaceTab,
  openOrFocusWorkspaceTab,
  validateSafeWorkspaceUrl,
} from '../utils/desktopWorkspace';
import {
  clearAllSmartLoginCredentials,
  deleteSmartLoginCredential,
  evaluateAutofillCompatibility,
  listSmartLoginCredentials,
  removeCredentialMeta,
  saveSmartLoginCredential,
  setSmartLoginNeverSave,
  toggleCredentialAutofillMeta,
  toggleSmartLoginAutofill,
  upsertCredentialMeta,
} from '../utils/smartLogin';

export function PublicDashboard() {
  const {
    publicApplications,
    publicCategories,
    settings,
    loadingPublic,
    publicError,
    favoriteIds,
    toggleFavorite,
  } = usePortal();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [moreCategoriesOpen, setMoreCategoriesOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Multi-Tab Internal Browser Workspace State
  const [workspaceTabs, setWorkspaceTabs] = useState<WorkspaceTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('dashboard');
  const [isWorkspaceFullScreen, setIsWorkspaceFullScreen] = useState<boolean>(false);

  // Iniyandit Smart Login (Credential Assistant) State
  const [smartCredentials, setSmartCredentials] = useState<SmartLoginCredentialMeta[]>([]);
  const [savedCredentialsModalOpen, setSavedCredentialsModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalTargetApp, setSaveModalTargetApp] = useState<ApplicationItem | null>(null);
  const [saveModalInitialUsername, setSaveModalInitialUsername] = useState('');
  const [saveModalIsUpdating, setSaveModalIsUpdating] = useState(false);
  const [lastAutofillResult, setLastAutofillResult] = useState<SmartLoginAutofillResult | null>(
    null
  );

  const desktopBridge = useMemo(() => getDesktopBridge(), []);

  // Load locally encrypted Smart Login credentials metadata on mount
  useEffect(() => {
    let mounted = true;
    listSmartLoginCredentials(desktopBridge)
      .then((items) => {
        if (mounted) setSmartCredentials(items);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [desktopBridge]);

  // Subscribe to Electron WebContentsView state, popup requests, Full Screen state, and Smart Login autofill results
  useEffect(() => {
    if (!desktopBridge) return;

    const unsubState = desktopBridge.onTabStateChange((state) => {
      setWorkspaceTabs((prev) =>
        prev.map((tab) => {
          if (tab.tabId !== state.tabId) return tab;
          return {
            ...tab,
            currentUrl: state.url || tab.currentUrl,
            isLoading: state.isLoading ?? tab.isLoading,
            hasError: state.hasError ?? tab.hasError,
            errorDescription: state.errorDescription ?? tab.errorDescription,
            errorCode: state.errorCode ?? tab.errorCode,
          };
        })
      );
    });

    const unsubPopup = desktopBridge.onPopupTabRequest(({ url }) => {
      const check = validateSafeWorkspaceUrl(url);
      if (!check.valid) return;
      const popupApp: Pick<ApplicationItem, 'id' | 'name' | 'url' | 'logoUrl' | 'categoryId'> = {
        id: `popup-${Date.now()}`,
        name: check.hostname || 'Jendela Aplikasi',
        url: check.normalizedUrl,
        logoUrl: '',
        categoryId: 'lainnya',
      };
      setWorkspaceTabs((prev) => {
        const res = openOrFocusWorkspaceTab(prev, popupApp);
        setActiveTabId(res.activeTabId);
        const created = res.tabs.find((t) => t.tabId === res.activeTabId);
        if (created) {
          desktopBridge.openTab({
            tabId: created.tabId,
            url: created.initialUrl,
            title: created.title,
            appId: created.appId,
          });
        }
        return res.tabs;
      });
    });

    const unsubAutofill = desktopBridge.onAutofillResult
      ? desktopBridge.onAutofillResult((result) => {
          setLastAutofillResult(result);
        })
      : () => {};

    const unsubFullScreen = desktopBridge.onFullScreenChange
      ? desktopBridge.onFullScreenChange(({ isFullScreen }) => {
          setIsWorkspaceFullScreen(Boolean(isFullScreen));
        })
      : () => {};

    return () => {
      unsubState();
      unsubPopup();
      unsubAutofill();
      unsubFullScreen();
    };
  }, [desktopBridge]);

  const primaryCategories = useMemo(() => publicCategories.slice(0, 4), [publicCategories]);
  const overflowCategories = useMemo(() => publicCategories.slice(4), [publicCategories]);
  const selectedOverflowCategory = useMemo(
    () => overflowCategories.find((c) => c.id === selectedCategoryId),
    [overflowCategories, selectedCategoryId]
  );

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    for (const cat of publicCategories) {
      map.set(cat.id, { name: cat.name, icon: cat.icon });
    }
    return map;
  }, [publicCategories]);

  const filteredApplications = useMemo(
    () =>
      filterAndSortApplications({
        applications: publicApplications,
        categories: publicCategories,
        searchQuery,
        selectedCategoryId,
        favoriteIds,
        onlyActive: true,
      }),
    [publicApplications, publicCategories, searchQuery, selectedCategoryId, favoriteIds]
  );

  const activeFavoritesCount = useMemo(
    () => publicApplications.filter((app) => favoriteIds.includes(app.id)).length,
    [publicApplications, favoriteIds]
  );

  const activeWorkspaceTab = useMemo(
    () => workspaceTabs.find((t) => t.tabId === activeTabId) || null,
    [workspaceTabs, activeTabId]
  );

  const handleToggleFavorite = (appId: string, appName: string) => {
    const willBeFavorite = !favoriteIds.includes(appId);
    toggleFavorite(appId);
    showToast({
      type: 'info',
      title: willBeFavorite ? 'Ditambahkan ke Favorit' : 'Dihapus dari Favorit',
      description: willBeFavorite
        ? `${appName} disimpan di daftar favorit perangkat ini.`
        : `${appName} dihapus dari daftar favorit.`,
    });
  };

  // Open an application inside the Integrated Desktop Workspace (Multi-Tab Internal Browser)
  const handleOpenApplicationInWorkspace = useCallback(
    (app: ApplicationItem) => {
      const result = openOrFocusWorkspaceTab(workspaceTabs, app);
      if (result.error) {
        showToast({
          type: 'error',
          title: 'URL Aplikasi Tidak Valid',
          description: result.error,
        });
        return;
      }

      setWorkspaceTabs(result.tabs);
      setActiveTabId(result.activeTabId);

      const targetTab = result.tabs.find((t) => t.tabId === result.activeTabId);
      if (desktopBridge && targetTab) {
        desktopBridge.openTab({
          tabId: targetTab.tabId,
          url: targetTab.initialUrl,
          title: targetTab.title,
          appId: targetTab.appId,
        });
      }
    },
    [workspaceTabs, desktopBridge, showToast]
  );

  // Smart Login Handlers (Encrypted Local Credential Assistant)
  const handleOpenSaveCredentialModal = useCallback(
    (app: ApplicationItem | null, existingUsername = '', isUpdate = false) => {
      setSaveModalTargetApp(app);
      setSaveModalInitialUsername(existingUsername);
      setSaveModalIsUpdating(isUpdate);
      setSaveModalOpen(true);
    },
    []
  );

  const handleSaveCredential = useCallback(
    async (payload: {
      appId: string;
      appName: string;
      appUrl: string;
      username: string;
      password: string;
      autofillEnabled: boolean;
    }) => {
      const res = await saveSmartLoginCredential(desktopBridge, payload);
      if (!res.ok || !res.item) {
        showToast({
          type: 'error',
          title: 'Gagal Menyimpan Akun',
          description: res.error || 'Terjadi kesalahan saat mengenkripsi kredensial.',
        });
        throw new Error(res.error || 'Gagal menyimpan');
      }

      setSmartCredentials((prev) => upsertCredentialMeta(prev, res.item!));
      showToast({
        type: 'success',
        title: 'Akun Tersimpan secara Lokal',
        description: `Akun ${payload.appName} (${payload.username}) dienkripsi pada perangkat ini.`,
      });
    },
    [desktopBridge, showToast]
  );

  const handleDontSaveCredential = useCallback(
    async (app: ApplicationItem) => {
      const res = await setSmartLoginNeverSave(desktopBridge, {
        appId: app.id,
        appName: app.name,
        appUrl: app.url,
      });
      setSmartCredentials((prev) => upsertCredentialMeta(prev, res.item));
      showToast({
        type: 'info',
        title: 'Preferensi Disimpan',
        description: `Akun dan password untuk ${app.name} tidak akan disimpan pada perangkat ini.`,
      });
    },
    [desktopBridge, showToast]
  );

  const handleToggleAutofill = useCallback(
    async (appId: string, enabled: boolean) => {
      await toggleSmartLoginAutofill(desktopBridge, appId, enabled);
      setSmartCredentials((prev) => toggleCredentialAutofillMeta(prev, appId, enabled));
      showToast({
        type: 'info',
        title: enabled ? 'Autofill Diaktifkan' : 'Autofill Dinonaktifkan',
        description: enabled
          ? 'Form login kompatibel akan diisi otomatis saat aplikasi dibuka.'
          : 'Pengisian otomatis dinonaktifkan untuk aplikasi ini.',
      });
    },
    [desktopBridge, showToast]
  );

  const handleDeleteCredential = useCallback(
    async (appId: string, appName: string) => {
      await deleteSmartLoginCredential(desktopBridge, appId);
      setSmartCredentials((prev) => removeCredentialMeta(prev, appId));
      setLastAutofillResult((prev) => (prev?.appId === appId ? null : prev));
      showToast({
        type: 'info',
        title: 'Akun Tersimpan Dihapus',
        description: `Kredensial lokal untuk ${appName} telah dihapus dari perangkat ini.`,
      });
    },
    [desktopBridge, showToast]
  );

  const handleClearAllCredentials = useCallback(async () => {
    await clearAllSmartLoginCredentials(desktopBridge);
    setSmartCredentials([]);
    setLastAutofillResult(null);
    showToast({
      type: 'info',
      title: 'Seluruh Akun Dihapus',
      description: 'Semua kredensial yang tersimpan pada perangkat ini telah dihapus.',
    });
  }, [desktopBridge, showToast]);

  const handleTriggerAutofill = useCallback(
    async (tab: WorkspaceTab) => {
      if (desktopBridge?.triggerAutofill) {
        const res = await desktopBridge.triggerAutofill(tab.tabId, tab.appId);
        setLastAutofillResult({ ...res, tabId: tab.tabId, appId: tab.appId });
        return;
      }

      const record = smartCredentials.find((c) => c.appId === tab.appId) || null;
      const evaluated = evaluateAutofillCompatibility({
        appUrl: tab.initialUrl,
        currentTabUrl: tab.currentUrl,
        isElectronRuntime: false,
        record,
      });
      setLastAutofillResult({
        ...evaluated,
        tabId: tab.tabId,
        appId: tab.appId,
      });
    },
    [desktopBridge, smartCredentials]
  );

  const handleCopyUsername = useCallback(
    (username: string, appName: string) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(username).catch(() => {});
      }
      showToast({
        type: 'success',
        title: 'Username Disalin',
        description: `Username untuk ${appName} (${username}) disalin ke clipboard.`,
      });
    },
    [showToast]
  );

  const handleSetWorkspaceFullScreen = useCallback(
    (nextFlag: boolean) => {
      const targetFlag = activeTabId === 'dashboard' ? false : Boolean(nextFlag);
      setIsWorkspaceFullScreen(targetFlag);
      if (desktopBridge?.setFullScreen) {
        desktopBridge.setFullScreen(targetFlag).catch(() => {});
      }
    },
    [activeTabId, desktopBridge]
  );

  const handleToggleWorkspaceFullScreen = useCallback(() => {
    setIsWorkspaceFullScreen((prev) => {
      const nextFlag = activeTabId === 'dashboard' ? false : !prev;
      if (desktopBridge?.setFullScreen) {
        desktopBridge.setFullScreen(nextFlag).catch(() => {});
      }
      return nextFlag;
    });
  }, [activeTabId, desktopBridge]);

  // Keyboard shortcuts for Full Screen: F11 (toggle), Ctrl+Shift+F (toggle), Escape (exit)
  useEffect(() => {
    const hasModalOverlay = aboutModalOpen || saveModalOpen || savedCredentialsModalOpen;
    const onKeyDown = (event: KeyboardEvent) => {
      const action = evaluateFullScreenShortcut(event, {
        hasActiveAppTab: Boolean(activeWorkspaceTab),
        isFullScreen: isWorkspaceFullScreen,
        hasModalOverlay,
      });

      if (action === 'toggle') {
        event.preventDefault();
        handleToggleWorkspaceFullScreen();
      } else if (action === 'exit') {
        event.preventDefault();
        handleSetWorkspaceFullScreen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeWorkspaceTab,
    isWorkspaceFullScreen,
    aboutModalOpen,
    saveModalOpen,
    savedCredentialsModalOpen,
    handleToggleWorkspaceFullScreen,
    handleSetWorkspaceFullScreen,
  ]);

  const handleSelectWorkspaceTab = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId);
      if (tabId === 'dashboard') {
        setIsWorkspaceFullScreen(false);
        if (desktopBridge?.setFullScreen) {
          desktopBridge.setFullScreen(false).catch(() => {});
        }
      }
      if (desktopBridge) {
        desktopBridge.switchTab(tabId);
      }
    },
    [desktopBridge]
  );

  const handleCloseWorkspaceTab = useCallback(
    (tabIdToClose: string) => {
      const result = closeWorkspaceTab(workspaceTabs, activeTabId, tabIdToClose);
      setWorkspaceTabs(result.tabs);
      setActiveTabId(result.activeTabId);
      if (result.activeTabId === 'dashboard') {
        setIsWorkspaceFullScreen(false);
      }

      if (desktopBridge) {
        desktopBridge.closeTab(tabIdToClose);
        desktopBridge.switchTab(result.activeTabId);
      }
    },
    [workspaceTabs, activeTabId, desktopBridge]
  );

  const handleCloseAllWorkspaceTabs = useCallback(() => {
    setIsWorkspaceFullScreen(false);
    if (desktopBridge) {
      if (desktopBridge.setFullScreen) {
        desktopBridge.setFullScreen(false).catch(() => {});
      }
      for (const t of workspaceTabs) {
        desktopBridge.closeTab(t.tabId);
      }
      desktopBridge.switchTab('dashboard');
    }
    setWorkspaceTabs([]);
    setActiveTabId('dashboard');
  }, [workspaceTabs, desktopBridge]);

  const handleNavigateWorkspaceTab = useCallback(
    (tabId: string, action: 'back' | 'forward' | 'reload' | 'home') => {
      const target = workspaceTabs.find((t) => t.tabId === tabId);
      if (!target) return;

      setWorkspaceTabs((prev) => navigateWorkspaceTab(prev, tabId, action));

      if (desktopBridge) {
        if (action === 'back') desktopBridge.goBack(tabId);
        else if (action === 'forward') desktopBridge.goForward(tabId);
        else if (action === 'reload') desktopBridge.reload(tabId);
        else if (action === 'home') desktopBridge.goHome(tabId, target.initialUrl);
      }
    },
    [workspaceTabs, desktopBridge]
  );

  const handleMarkTabLoaded = useCallback((tabId: string) => {
    setWorkspaceTabs((prev) =>
      prev.map((tab) => (tab.tabId === tabId ? { ...tab, isLoading: false } : tab))
    );
  }, []);

  const handleToggleTabErrorView = useCallback(
    (tabId: string, showError: boolean, reason?: string) => {
      setWorkspaceTabs((prev) =>
        prev.map((tab) =>
          tab.tabId === tabId
            ? {
                ...tab,
                hasError: showError,
                isLoading: false,
                errorDescription: reason || tab.errorDescription,
              }
            : tab
        )
      );
    },
    []
  );

  const handleDismissCompatibilityNotice = useCallback((tabId: string) => {
    setWorkspaceTabs((prev) =>
      prev.map((tab) =>
        tab.tabId === tabId ? { ...tab, compatibilityNoticeDismissed: true } : tab
      )
    );
  }, []);

  // Explicit fallback to open a URL in the external system browser only when requested by the user
  const handleOpenExternalFallback = useCallback(
    (url: string) => {
      const check = validateSafeWorkspaceUrl(url);
      if (!check.valid) return;

      if (desktopBridge) {
        desktopBridge.openExternal(check.normalizedUrl);
        return;
      }

      const anchor = document.createElement('a');
      anchor.href = check.normalizedUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer external';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    },
    [desktopBridge]
  );

  const savedCredentialsCount = useMemo(
    () => smartCredentials.filter((c) => c.policy === 'saved').length,
    [smartCredentials]
  );

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Navigation Header (Hidden when Full Screen Mode is active on an application tab) */}
      <header
        className={
          isWorkspaceFullScreen && activeWorkspaceTab
            ? 'hidden'
            : 'sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-2xs'
        }
        data-testid="portal-main-header"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Brand Logo + Portal Name + Institution Name */}
          <Link
            to="/"
            onClick={() => {
              handleSelectWorkspaceTab('dashboard');
              setSelectedCategoryId('all');
              setSearchQuery('');
            }}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-xl min-w-0 shrink-0"
          >
            <IniyanditLogo
              variant="horizontal"
              size={44}
              portalName={settings.portalName}
              institutionName={settings.institutionName}
              customLogoUrl={settings.logoUrl}
              officialLogoUrl={settings.officialLogoUrl}
            />
          </Link>

          {/* Right Side: Search Bar + Settings/About + Admin Button */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3.5 flex-1 max-w-xl">
            {/* Desktop & Tablet Search Bar */}
            <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-[#0F766E] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTabId !== 'dashboard') {
                      handleSelectWorkspaceTab('dashboard');
                    }
                  }}
                  placeholder="Cari aplikasi..."
                  aria-label="Cari aplikasi"
                  className="w-full pl-10 pr-9 py-2 rounded-full bg-[#F1F5F9] hover:bg-slate-200/65 focus:bg-white text-sm text-[#0F172A] placeholder:text-[#64748B] border border-slate-200/80 focus:border-[#14B8A6] focus:outline-none focus:ring-3 focus:ring-[#14B8A6]/15 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Bersihkan pencarian"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tentang Aplikasi / Info Pengaturan Button */}
            <button
              type="button"
              onClick={() => setAboutModalOpen(true)}
              title="Tentang Aplikasi & Identitas Pengembang"
              aria-label="Tentang Aplikasi"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0]/80 text-[#0F766E] border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Admin Portal Button */}
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-linear-to-r from-[#0F766E] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F766E]"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Admin</span>
            </Link>
          </div>
        </div>

        {/* Responsive Mobile Search Bar (Visible on Dashboard View) */}
        {activeTabId === 'dashboard' && (
          <div className="md:hidden px-4 pb-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#0F766E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aplikasi..."
                aria-label="Cari aplikasi mobile"
                className="w-full pl-10 pr-9 py-2 rounded-full bg-[#F1F5F9] focus:bg-white text-sm text-[#0F172A] placeholder:text-[#64748B] border border-slate-200/80 focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Bersihkan pencarian mobile"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Multi-Tab Internal Browser Bar (Shown whenever 1+ application tabs are open) */}
        {workspaceTabs.length > 0 && (
          <WorkspaceTabBar
            tabs={workspaceTabs}
            activeTabId={activeTabId}
            categoryIconMap={categoryMap}
            onSelectTab={handleSelectWorkspaceTab}
            onCloseTab={handleCloseWorkspaceTab}
            onCloseAllTabs={handleCloseAllWorkspaceTabs}
            isElectronRuntime={Boolean(desktopBridge)}
          />
        )}
      </header>

      {/* Conditional View: Internal Browser Workspace vs. Main Dashboard */}
      {activeWorkspaceTab ? (
        <InternalBrowserWorkspace
          tabs={workspaceTabs}
          activeTab={activeWorkspaceTab}
          applications={publicApplications}
          categoryMap={categoryMap}
          desktopBridge={desktopBridge}
          overlayModalOpen={aboutModalOpen || saveModalOpen || savedCredentialsModalOpen}
          isFullScreen={isWorkspaceFullScreen}
          credentials={smartCredentials}
          lastAutofillResult={lastAutofillResult}
          onSelectDashboard={() => handleSelectWorkspaceTab('dashboard')}
          onOpenApplication={handleOpenApplicationInWorkspace}
          onNavigateTab={handleNavigateWorkspaceTab}
          onMarkTabLoaded={handleMarkTabLoaded}
          onToggleTabErrorView={handleToggleTabErrorView}
          onDismissCompatibilityNotice={handleDismissCompatibilityNotice}
          onOpenExternalBrowser={handleOpenExternalFallback}
          onToggleFullScreen={handleToggleWorkspaceFullScreen}
          onExitFullScreen={() => handleSetWorkspaceFullScreen(false)}
          onOpenSaveCredentialModal={(app, existingUser, isUpdate) =>
            handleOpenSaveCredentialModal(app, existingUser, isUpdate)
          }
          onDontSaveCredential={handleDontSaveCredential}
          onToggleAutofill={handleToggleAutofill}
          onDeleteCredential={handleDeleteCredential}
          onTriggerAutofill={handleTriggerAutofill}
          onOpenCredentialsManager={() => setSavedCredentialsModalOpen(true)}
          onCopyUsername={handleCopyUsername}
        />
      ) : (
        <>
          {/* Main Dashboard Content Container */}
          <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            {/* Official Header Banner Section */}
            <section
              aria-label="Sambutan Portal"
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-linear-to-r from-[#F0FDFA] via-[#E0F2FE]/90 to-[#BAE6FD] border border-[#CBD5E1]/70 shadow-md mb-6"
            >
              <h1 className="sr-only">
                Selamat Datang di {settings.portalName || 'Iniyandit Application Center'} — Seluruh
                aplikasi kerja Puskesmas Iniyandit kini tersedia dalam satu pintu.
              </h1>
              <img
                src="/assets/aistudio/Iniyandit_Healthcare_Application_Center_f8c24167.png"
                alt="Selamat Datang di Iniyandit Application Center — UPTD Puskesmas Iniyandit"
                className="w-full h-auto block object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </section>

            {/* Dynamic Category, Favorites & Smart Login Manager Bar */}
            <section aria-label="Filter Kategori Aplikasi" className="mb-6 relative">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId('all');
                      setMoreCategoriesOpen(false);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedCategoryId === 'all'
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#14B8A6] hover:text-[#0F766E]'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Semua</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId('favorites');
                      setMoreCategoriesOpen(false);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedCategoryId === 'favorites'
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#14B8A6] hover:text-[#0F766E]'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        selectedCategoryId === 'favorites'
                          ? 'fill-white text-white'
                          : activeFavoritesCount > 0
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>Favorit</span>
                    {activeFavoritesCount > 0 && (
                      <span className="tabular-nums text-xs opacity-90">
                        ({activeFavoritesCount})
                      </span>
                    )}
                  </button>

                  {primaryCategories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setMoreCategoriesOpen(false);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F766E] text-white shadow-xs'
                            : 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#14B8A6] hover:text-[#0F766E]'
                        }`}
                      >
                        <CategoryIcon
                          icon={cat.icon}
                          className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#0F766E]'}`}
                        />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}

                  <div className="flex lg:hidden items-center gap-2">
                    {overflowCategories.map((cat) => {
                      const isSelected = selectedCategoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-[#0F766E] text-white shadow-xs'
                              : 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#14B8A6] hover:text-[#0F766E]'
                          }`}
                        >
                          <CategoryIcon
                            icon={cat.icon}
                            className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#0F766E]'}`}
                          />
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Filter Bar Actions: Pengelola Akun Tersimpan + Lainnya Dropdown */}
                <div className="flex items-center gap-2 shrink-0 pb-1">
                  <button
                    type="button"
                    onClick={() => setSavedCredentialsModalOpen(true)}
                    data-testid="open-saved-credentials-btn"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F0FDFA] hover:bg-teal-100/80 text-[#0F766E] border border-[#14B8A6]/45 text-xs sm:text-sm font-bold shadow-2xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-[#0F766E]" />
                    <span className="hidden sm:inline">Pengelola Akun Tersimpan</span>
                    <span className="sm:hidden">Smart Login</span>
                    {savedCredentialsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#0F766E] text-white text-[11px] font-extrabold tabular-nums">
                        {savedCredentialsCount}
                      </span>
                    )}
                  </button>

                  {overflowCategories.length > 0 && (
                    <div className="hidden lg:block relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setMoreCategoriesOpen((prev) => !prev)}
                        aria-expanded={moreCategoriesOpen}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedOverflowCategory
                            ? 'bg-[#0F766E] text-white shadow-xs'
                            : 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#14B8A6] hover:text-[#0F766E]'
                        }`}
                      >
                        <span>
                          {selectedOverflowCategory ? selectedOverflowCategory.name : 'Lainnya'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            moreCategoriesOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {moreCategoriesOpen && (
                        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-[#E2E8F0] shadow-xl py-2 z-30">
                          {overflowCategories.map((cat) => {
                            const isSelected = selectedCategoryId === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCategoryId(cat.id);
                                  setMoreCategoriesOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#F0FDFA] text-[#0F766E]'
                                    : 'text-[#0F172A] hover:bg-slate-50'
                                }`}
                              >
                                <CategoryIcon icon={cat.icon} className="w-4 h-4 text-[#0F766E]" />
                                <span className="truncate">{cat.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Active Filter Context Header */}
            {(searchQuery.trim() !== '' || selectedCategoryId !== 'all') && (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
                <div className="text-xs sm:text-sm text-[#64748B]">
                  Menampilkan{' '}
                  <span className="font-bold text-[#0F172A] tabular-nums">
                    {filteredApplications.length}
                  </span>{' '}
                  aplikasi
                  {selectedCategoryId === 'favorites'
                    ? ' favorit Anda'
                    : selectedCategoryId !== 'all'
                    ? ` pada kategori "${categoryMap.get(selectedCategoryId)?.name || selectedCategoryId}"`
                    : ''}
                  {searchQuery.trim() ? ` untuk pencarian "${searchQuery.trim()}"` : ''}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryId('all');
                  }}
                  className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
                >
                  Tampilkan Semua Aplikasi
                </button>
              </div>
            )}

            {/* Error State */}
            {publicError && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 text-center my-6">
                <p className="text-sm font-semibold text-rose-800">{publicError}</p>
                <p className="text-xs text-rose-600 mt-1">
                  Pastikan koneksi internet aktif dan muat ulang halaman.
                </p>
              </div>
            )}

            {/* Loading Skeleton State */}
            {loadingPublic ? (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-5"
                aria-label="Memuat daftar aplikasi"
              >
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 flex flex-col items-center animate-pulse h-[248px]"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 mt-2 mb-4" />
                    <div className="w-28 h-4 rounded bg-slate-200 mb-2" />
                    <div className="w-20 h-3 rounded bg-slate-100 mb-3" />
                    <div className="w-full h-3 rounded bg-slate-100 mb-auto" />
                    <div className="w-full h-9 rounded-full bg-slate-200 mt-4" />
                  </div>
                ))}
              </div>
            ) : publicApplications.length === 0 ? (
              /* Honest Empty State when zero applications exist in database */
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 sm:p-12 text-center max-w-xl mx-auto my-6 shadow-2xs">
                <div className="w-16 h-16 rounded-2xl bg-[#F0FDFA] border border-[#14B8A6]/30 text-[#0F766E] flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                  Belum ada aplikasi tersedia.
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
                  Daftar aplikasi kerja UPTD Puskesmas Iniyandit akan tampil secara otomatis di
                  halaman ini setelah ditambahkan dan diaktifkan oleh Administrator portal.
                </p>
                <div className="mt-6">
                  <Link
                    to="/admin/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    <span>Buka Portal Admin</span>
                  </Link>
                </div>
              </div>
            ) : filteredApplications.length === 0 ? (
              /* Filtered Empty State */
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center max-w-lg mx-auto my-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  {selectedCategoryId === 'favorites' && searchQuery.trim() === ''
                    ? 'Belum ada aplikasi favorit.'
                    : 'Aplikasi tidak ditemukan.'}
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
                  {selectedCategoryId === 'favorites' && searchQuery.trim() === ''
                    ? 'Tekan ikon hati pada kartu aplikasi untuk menyimpannya ke daftar favorit Anda.'
                    : 'Coba gunakan kata kunci pencarian lain atau pilih kategori Semua Aplikasi.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryId('all');
                  }}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Filter &amp; Pencarian
                </button>
              </div>
            ) : (
              /* Responsive Application Launcher Grid */
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-5"
                data-testid="public-applications-grid"
              >
                {filteredApplications.map((app) => {
                  const catInfo = categoryMap.get(app.categoryId);
                  const categoryName = catInfo?.name || app.categoryId;
                  const isFavorite = favoriteIds.includes(app.id);
                  const isAlreadyOpen = workspaceTabs.some((t) => t.appId === app.id);
                  const savedCred = smartCredentials.find(
                    (c) => c.appId === app.id && c.policy === 'saved'
                  );

                  return (
                    <article
                      key={app.id}
                      className="group relative bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#14B8A6] p-4 sm:p-5 flex flex-col items-center text-center shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {/* Top-Left Smart Login / Open Tab Indicator */}
                      {isAlreadyOpen ? (
                        <span
                          className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700"
                          title="Aplikasi sedang aktif di tab atas"
                        >
                          <span>Aktif</span>
                        </span>
                      ) : savedCred ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenSaveCredentialModal(app, savedCred.username, true)
                          }
                          title={`Smart Login Tersimpan (${savedCred.username}) — Klik untuk kelola`}
                          data-testid={`card-smartlogin-badge-${app.id}`}
                          className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FDFA] hover:bg-teal-100/80 border border-[#14B8A6]/40 text-[10px] font-bold text-[#0F766E] cursor-pointer z-10"
                        >
                          <KeyRound className="w-2.5 h-2.5" />
                          <span>Akun Tersimpan</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSaveCredentialModal(app, '', false)}
                          title={`Simpan akun & password opsional untuk ${app.name}`}
                          data-testid={`card-smartlogin-save-${app.id}`}
                          className="absolute top-3 left-3 p-1.5 rounded-full text-slate-400 hover:text-[#0F766E] hover:bg-[#F0FDFA] transition-colors cursor-pointer z-10"
                          aria-label={`Simpan akun ${app.name}`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Favorite Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(app.id, app.name)}
                        aria-label={
                          isFavorite
                            ? `Hapus ${app.name} dari favorit`
                            : `Tambahkan ${app.name} ke favorit`
                        }
                        className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer z-10"
                      >
                        <Heart
                          className={`w-4 h-4 transition-transform active:scale-125 ${
                            isFavorite ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>

                      {/* Clickable Logo & Title Area (Opens Inside Desktop Application Workspace) */}
                      <button
                        type="button"
                        onClick={() => handleOpenApplicationInWorkspace(app)}
                        className="flex flex-col items-center w-full flex-1 focus:outline-none cursor-pointer"
                      >
                        <div className="mt-1 mb-3">
                          <ApplicationLogoBadge
                            name={app.name}
                            logoUrl={app.logoUrl}
                            categoryIcon={catInfo?.icon}
                            size="md"
                          />
                        </div>

                        <h2 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#0F766E] transition-colors line-clamp-1 w-full">
                          {app.name}
                        </h2>

                        <p className="text-[11px] sm:text-xs font-medium text-[#64748B] mt-0.5 line-clamp-1">
                          {categoryName}
                        </p>

                        {app.description ? (
                          <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {app.description}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
                            Portal layanan terintegrasi
                          </p>
                        )}
                      </button>

                      {/* Open Application Inside Desktop Workspace Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenApplicationInWorkspace(app)}
                        data-testid={`launch-app-btn-${app.id}`}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-semibold shadow-2xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Monitor className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAlreadyOpen ? 'Fokus Tab Aplikasi' : 'Buka Aplikasi'}</span>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </main>

          {/* Footer with Official Developer Attribution & Wave/Leaf Accent */}
          <footer className="relative overflow-hidden border-t border-[#E2E8F0] bg-linear-to-r from-white via-[#F0FDFA]/80 to-[#ECFDF5] py-6 px-4 sm:px-6 lg:px-8 mt-10">
            <svg
              viewBox="0 0 120 70"
              fill="none"
              className="hidden sm:block absolute bottom-0 right-2 w-24 h-auto pointer-events-none select-none opacity-90"
              aria-hidden="true"
            >
              <path d="M42 66C48 36 72 14 106 4C98 36 78 58 42 66Z" fill="#65A30D" />
              <path
                d="M45 64C62 44 80 28 98 12"
                stroke="#ECFDF5"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M38 62C22 46 18 28 24 12C40 22 46 40 38 62Z" fill="#84CC16" />
            </svg>

            <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#475569]">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <IniyanditLogo variant="square" size={38} customLogoUrl={settings.logoUrl} />
                <div>
                  <p className="font-extrabold text-[#064E3B] text-xs sm:text-sm leading-tight">
                    {settings.portalName || 'Iniyandit Application Center'}
                  </p>
                  <p className="text-[11px] sm:text-xs font-semibold text-[#0F766E]">
                    {settings.institutionName || 'UPTD Puskesmas Iniyandit'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 md:border-l md:border-r border-[#CBD5E1]/70 md:px-6 text-center sm:text-left">
                <div>
                  <p className="text-[11px] text-[#64748B]">Dirancang dan Dikembangkan oleh</p>
                  <p className="text-xs sm:text-sm font-extrabold text-[#0F172A]">
                    Sulfikri Hidayat, S.Tr.Kes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAboutModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-teal-50 text-[#0F766E] border border-[#14B8A6]/35 text-[11px] font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Tentang Aplikasi</span>
                </button>
              </div>

              <div className="text-center md:text-right sm:pr-16">
                <p className="font-semibold text-[#0F172A]">
                  © {currentYear} Iniyandit Application Center
                </p>
                <p className="text-[11px] text-[#64748B]">UPTD Puskesmas Iniyandit</p>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Modal Simpan / Ganti Akun (Iniyandit Smart Login) */}
      <SmartLoginSaveModal
        open={saveModalOpen}
        targetApp={saveModalTargetApp}
        applications={publicApplications}
        initialUsername={saveModalInitialUsername}
        initialAutofillEnabled={true}
        isUpdatingExisting={saveModalIsUpdating}
        onClose={() => setSaveModalOpen(false)}
        onSaveCredential={handleSaveCredential}
        onDontSaveForApp={handleDontSaveCredential}
      />

      {/* Modal Pengelola Akun Tersimpan (Iniyandit Smart Login) */}
      <SavedCredentialsModal
        open={savedCredentialsModalOpen}
        credentials={smartCredentials}
        applications={publicApplications}
        categoryMap={categoryMap}
        isElectronRuntime={Boolean(desktopBridge)}
        onClose={() => setSavedCredentialsModalOpen(false)}
        onOpenSaveModal={(app, existingUser, isUpdate) => {
          setSavedCredentialsModalOpen(false);
          handleOpenSaveCredentialModal(app, existingUser || '', Boolean(isUpdate));
        }}
        onToggleAutofill={handleToggleAutofill}
        onDeleteCredential={handleDeleteCredential}
        onClearAllCredentials={handleClearAllCredentials}
      />

      {/* Modal Tentang Aplikasi */}
      <AboutModal
        open={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        portalName={settings.portalName}
        institutionName={settings.institutionName}
        tagline={settings.tagline}
      />
    </div>
  );
}
