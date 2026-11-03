import { ApplicationItem } from '../types';

export interface WorkspaceTab {
  tabId: string;
  appId: string;
  title: string;
  initialUrl: string;
  currentUrl: string;
  logoUrl: string;
  categoryId: string;
  isLoading: boolean;
  hasError: boolean;
  errorDescription?: string;
  errorCode?: number;
  reloadKey: number;
  history: string[];
  historyIndex: number;
  compatibilityNoticeDismissed?: boolean;
}

export interface SafeUrlValidationResult {
  valid: boolean;
  normalizedUrl: string;
  protocol: string | null;
  hostname: string | null;
  reason?: string;
}

/**
 * Validates that a URL to be opened in the internal desktop browser uses only HTTP or HTTPS
 * and has a valid hostname. Rejects javascript:, file:, data:, vbscript:, chrome:, etc.
 */
export function validateSafeWorkspaceUrl(rawUrl: string): SafeUrlValidationResult {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    return {
      valid: false,
      normalizedUrl: '',
      protocol: null,
      hostname: null,
      reason: 'URL aplikasi kosong.',
    };
  }

  const trimmed = rawUrl.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        normalizedUrl: trimmed,
        protocol: parsed.protocol,
        hostname: null,
        reason: `Protokol tidak diizinkan (${parsed.protocol}). Hanya HTTP dan HTTPS yang diperbolehkan.`,
      };
    }

    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        valid: false,
        normalizedUrl: trimmed,
        protocol: parsed.protocol,
        hostname: parsed.hostname || null,
        reason: 'Domain URL aplikasi tidak valid.',
      };
    }

    return {
      valid: true,
      normalizedUrl: trimmed,
      protocol: parsed.protocol,
      hostname: parsed.hostname,
    };
  } catch {
    return {
      valid: false,
      normalizedUrl: trimmed,
      protocol: null,
      hostname: null,
      reason: 'Format URL tidak valid.',
    };
  }
}

/**
 * Evaluates how the desktop internal browser should handle a popup / window.open request
 * from an external website.
 */
export function evaluatePopupPolicy(targetUrl: string): {
  action: 'open-in-workspace-tab' | 'deny';
  url: string;
  reason?: string;
} {
  const check = validateSafeWorkspaceUrl(targetUrl);
  if (!check.valid) {
    return {
      action: 'deny',
      url: targetUrl,
      reason: check.reason || 'Popup diblokir karena protokol/URL tidak aman.',
    };
  }

  return {
    action: 'open-in-workspace-tab',
    url: check.normalizedUrl,
  };
}

/**
 * Opens an application in the multi-tab workspace:
 * - If a tab for `app.id` already exists, activates that tab.
 * - Otherwise creates a new tab and sets it as active.
 */
export function openOrFocusWorkspaceTab(
  currentTabs: WorkspaceTab[],
  app: Pick<ApplicationItem, 'id' | 'name' | 'url' | 'logoUrl' | 'categoryId'>
): {
  tabs: WorkspaceTab[];
  activeTabId: string;
  error?: string;
} {
  const validation = validateSafeWorkspaceUrl(app.url);
  if (!validation.valid) {
    return {
      tabs: currentTabs,
      activeTabId: 'dashboard',
      error: validation.reason || 'URL aplikasi tidak valid.',
    };
  }

  const existing = currentTabs.find((t) => t.appId === app.id);
  if (existing) {
    return {
      tabs: currentTabs,
      activeTabId: existing.tabId,
    };
  }

  const newTab: WorkspaceTab = {
    tabId: `tab-${app.id}-${Date.now()}`,
    appId: app.id,
    title: app.name,
    initialUrl: validation.normalizedUrl,
    currentUrl: validation.normalizedUrl,
    logoUrl: app.logoUrl || '',
    categoryId: app.categoryId || '',
    isLoading: true,
    hasError: false,
    reloadKey: 1,
    history: [validation.normalizedUrl],
    historyIndex: 0,
    compatibilityNoticeDismissed: false,
  };

  return {
    tabs: [...currentTabs, newTab],
    activeTabId: newTab.tabId,
  };
}

/**
 * Closes a tab by `tabId` and computes the next active tab ID ('dashboard' if no tabs remain).
 */
export function closeWorkspaceTab(
  currentTabs: WorkspaceTab[],
  currentActiveTabId: string,
  tabIdToClose: string
): {
  tabs: WorkspaceTab[];
  activeTabId: string;
} {
  const idx = currentTabs.findIndex((t) => t.tabId === tabIdToClose);
  if (idx === -1) {
    return { tabs: currentTabs, activeTabId: currentActiveTabId };
  }

  const nextTabs = currentTabs.filter((t) => t.tabId !== tabIdToClose);

  if (currentActiveTabId !== tabIdToClose) {
    return {
      tabs: nextTabs,
      activeTabId: currentActiveTabId,
    };
  }

  if (nextTabs.length === 0) {
    return {
      tabs: [],
      activeTabId: 'dashboard',
    };
  }

  const fallbackIndex = Math.max(0, idx - 1);
  return {
    tabs: nextTabs,
    activeTabId: nextTabs[fallbackIndex].tabId,
  };
}

/**
 * Navigates a tab back, forward, reload, or home (initialUrl).
 */
export function navigateWorkspaceTab(
  currentTabs: WorkspaceTab[],
  tabId: string,
  action: 'back' | 'forward' | 'reload' | 'home'
): WorkspaceTab[] {
  return currentTabs.map((tab) => {
    if (tab.tabId !== tabId) return tab;

    if (action === 'reload') {
      return {
        ...tab,
        isLoading: true,
        hasError: false,
        errorDescription: undefined,
        reloadKey: tab.reloadKey + 1,
      };
    }

    if (action === 'home') {
      const nextHistory = [...tab.history.slice(0, tab.historyIndex + 1), tab.initialUrl];
      return {
        ...tab,
        currentUrl: tab.initialUrl,
        isLoading: true,
        hasError: false,
        errorDescription: undefined,
        reloadKey: tab.reloadKey + 1,
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      };
    }

    if (action === 'back' && tab.historyIndex > 0) {
      const nextIndex = tab.historyIndex - 1;
      return {
        ...tab,
        currentUrl: tab.history[nextIndex],
        historyIndex: nextIndex,
        isLoading: true,
        hasError: false,
        reloadKey: tab.reloadKey + 1,
      };
    }

    if (action === 'forward' && tab.historyIndex < tab.history.length - 1) {
      const nextIndex = tab.historyIndex + 1;
      return {
        ...tab,
        currentUrl: tab.history[nextIndex],
        historyIndex: nextIndex,
        isLoading: true,
        hasError: false,
        reloadKey: tab.reloadKey + 1,
      };
    }

    return tab;
  });
}

export interface SmartLoginCredentialMeta {
  appId: string;
  appName: string;
  appUrl: string;
  username: string;
  autofillEnabled: boolean;
  policy: 'saved' | 'never_save';
  hasStoredPassword: boolean;
  updatedAt: number;
}

export interface SmartLoginAutofillResult {
  tabId?: string;
  appId?: string;
  status:
    | 'autofilled'
    | 'no_login_form'
    | 'incompatible'
    | 'disabled'
    | 'no_credential'
    | 'unsafe_url'
    | 'no_tab';
  filledUsername?: boolean;
  filledPassword?: boolean;
  hasCaptchaOrOtp?: boolean;
  message: string;
}

export type FullScreenShortcutAction = 'toggle' | 'exit' | 'none';

/**
 * Pure helper to evaluate keyboard shortcuts for Full Screen mode:
 * - F11: toggle Full Screen when an application tab is active
 * - Ctrl + Shift + F (or Cmd + Shift + F): toggle Full Screen when an application tab is active
 * - Escape: exit Full Screen ONLY when Full Screen is currently active (never interferes with normal website forms when not in Full Screen)
 */
export function evaluateFullScreenShortcut(
  event: {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    defaultPrevented?: boolean;
  },
  state: {
    hasActiveAppTab: boolean;
    isFullScreen: boolean;
    hasModalOverlay?: boolean;
  }
): FullScreenShortcutAction {
  if (!state.hasActiveAppTab || event.defaultPrevented || state.hasModalOverlay) {
    return 'none';
  }

  const key = event.key || '';

  // F11 toggles Full Screen
  if (key === 'F11') {
    return 'toggle';
  }

  // Ctrl + Shift + F (or Cmd + Shift + F) toggles Full Screen
  if (
    (event.ctrlKey || event.metaKey) &&
    event.shiftKey &&
    !event.altKey &&
    key.toLowerCase() === 'f'
  ) {
    return 'toggle';
  }

  // Escape exits Full Screen ONLY if currently in Full Screen
  if (key === 'Escape' && state.isFullScreen) {
    return 'exit';
  }

  return 'none';
}

/**
 * Computes WebContentsView bounds for Electron based on whether Full Screen mode is active.
 * In Full Screen mode, the active application occupies 100% of the window (x: 0, y: 0, width, height)
 * with no header, toolbar, or sidebar offset.
 */
export function computeWorkspaceViewportBounds(params: {
  isFullScreen: boolean;
  windowWidth: number;
  windowHeight: number;
  containerRect: { left: number; top: number; width: number; height: number };
}): { x: number; y: number; width: number; height: number } {
  if (params.isFullScreen) {
    return {
      x: 0,
      y: 0,
      width: Math.max(0, Math.round(params.windowWidth)),
      height: Math.max(0, Math.round(params.windowHeight)),
    };
  }

  return {
    x: Math.max(0, Math.round(params.containerRect.left)),
    y: Math.max(0, Math.round(params.containerRect.top)),
    width: Math.max(0, Math.round(params.containerRect.width)),
    height: Math.max(0, Math.round(params.containerRect.height)),
  };
}

/**
 * Type definition for the secure Electron preload bridge (`window.iniyanditDesktop`)
 */
export interface IniyanditDesktopBridge {
  isElectron: boolean;
  platform: string;
  openTab: (payload: {
    tabId: string;
    url: string;
    title: string;
    appId?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  switchTab: (tabId: string) => Promise<void>;
  closeTab: (tabId: string) => Promise<void>;
  setBounds: (bounds: { x: number; y: number; width: number; height: number }) => Promise<void>;
  setOverlayVisible: (visible: boolean) => Promise<void>;
  goBack: (tabId: string) => Promise<void>;
  goForward: (tabId: string) => Promise<void>;
  reload: (tabId: string) => Promise<void>;
  goHome: (tabId: string, initialUrl: string) => Promise<void>;
  openExternal: (url: string) => Promise<boolean>;

  // Full Screen Mode (Per Active Application Tab)
  setFullScreen?: (flag: boolean) => Promise<{ ok: boolean; isFullScreen: boolean }>;
  toggleFullScreen?: () => Promise<{ ok: boolean; isFullScreen: boolean }>;
  getFullScreenState?: () => Promise<{ isFullScreen: boolean }>;
  onFullScreenChange?: (callback: (payload: { isFullScreen: boolean }) => void) => () => void;

  // Smart Login (Encrypted Local Credential Assistant)
  listSavedCredentials?: () => Promise<SmartLoginCredentialMeta[]>;
  saveCredential?: (payload: {
    appId: string;
    appName: string;
    appUrl: string;
    username: string;
    password: string;
    autofillEnabled: boolean;
  }) => Promise<{ ok: boolean; error?: string; item?: SmartLoginCredentialMeta }>;
  setNeverSavePolicy?: (payload: {
    appId: string;
    appName: string;
    appUrl: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  setAutofillEnabled?: (
    appId: string,
    enabled: boolean
  ) => Promise<{ ok: boolean; error?: string; autofillEnabled?: boolean }>;
  deleteCredential?: (appId: string) => Promise<{ ok: boolean; deleted?: boolean }>;
  clearAllCredentials?: () => Promise<{ ok: boolean }>;
  triggerAutofill?: (tabId: string, appId: string) => Promise<SmartLoginAutofillResult>;

  onTabStateChange: (
    callback: (state: {
      tabId: string;
      url?: string;
      title?: string;
      isLoading?: boolean;
      canGoBack?: boolean;
      canGoForward?: boolean;
      hasError?: boolean;
      errorDescription?: string;
      errorCode?: number;
    }) => void
  ) => () => void;
  onPopupTabRequest: (
    callback: (payload: { url: string; sourceTabId: string }) => void
  ) => () => void;
  onAutofillResult?: (callback: (payload: SmartLoginAutofillResult) => void) => () => void;
}

declare global {
  interface Window {
    iniyanditDesktop?: IniyanditDesktopBridge;
  }
}

export function getDesktopBridge(): IniyanditDesktopBridge | null {
  if (typeof window !== 'undefined' && window.iniyanditDesktop?.isElectron) {
    return window.iniyanditDesktop;
  }
  return null;
}
