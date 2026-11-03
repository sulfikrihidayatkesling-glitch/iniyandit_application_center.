import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidId,
  normalizeUrl,
  validateApplicationInput,
  validateCategoryInput,
  validateAdminUserInput,
  filterAndSortApplications,
  toggleFavoriteId,
  evaluateFirestoreRule,
  SimulatedRuleEnv,
  BOOTSTRAPPED_ADMIN_EMAIL,
} from './validation';
import {
  inspectExternalAppUrl,
  EXTERNAL_ANCHOR_PROPS,
  handleExternalAppClick,
} from './externalLauncher';
import {
  validateSafeWorkspaceUrl,
  evaluatePopupPolicy,
  openOrFocusWorkspaceTab,
  closeWorkspaceTab,
  navigateWorkspaceTab,
  evaluateFullScreenShortcut,
  computeWorkspaceViewportBounds,
} from './desktopWorkspace';
import {
  validateSmartLoginInput,
  getAppSmartLoginState,
  upsertCredentialMeta,
  toggleCredentialAutofillMeta,
  removeCredentialMeta,
  evaluateAutofillCompatibility,
  SMART_LOGIN_SECURITY_NOTICE,
} from './smartLogin';
import { ApplicationItem, CategoryItem } from '../types';

test('URL normalization and validation works cleanly', () => {
  assert.equal(normalizeUrl('satusehat.kemkes.go.id'), 'https://satusehat.kemkes.go.id');
  assert.equal(normalizeUrl('https://asik.kemkes.go.id'), 'https://asik.kemkes.go.id');

  const validApp = validateApplicationInput({
    name: 'SatuSehat SDMK',
    url: 'https://satusehat.kemkes.go.id/sdmk',
    logoUrl: '',
    categoryId: 'kemenkes',
    description: 'Portal SDM Kesehatan Kementerian Kesehatan RI',
    isActive: true,
    displayOrder: 1,
  });
  assert.equal(validApp.valid, true);

  const invalidApp = validateApplicationInput({
    name: '',
    url: 'invalid-url',
    logoUrl: '',
    categoryId: 'kemenkes',
    description: '',
    isActive: true,
    displayOrder: 1,
  });
  assert.equal(invalidApp.valid, false);
});

test('Public officer search, category filtering, and favorites work accurately', () => {
  const categories: CategoryItem[] = [
    {
      id: 'kemenkes',
      name: 'Kementerian Kesehatan',
      description: 'Aplikasi Kemenkes',
      icon: 'heart-pulse',
      displayOrder: 1,
      isActive: true,
      createdAt: null,
      updatedAt: null,
    },
    {
      id: 'kesling',
      name: 'Kesehatan Lingkungan',
      description: 'Aplikasi Kesling',
      icon: 'sprout',
      displayOrder: 2,
      isActive: true,
      createdAt: null,
      updatedAt: null,
    },
  ];

  const apps: ApplicationItem[] = [
    {
      id: 'satusehat',
      name: 'SatuSehat Platform',
      url: 'https://satusehat.kemkes.go.id',
      logoUrl: '',
      categoryId: 'kemenkes',
      description: 'Integrasi rekam medis elektronik nasional',
      isActive: true,
      displayOrder: 2,
      openCount: 10,
      createdAt: null,
      updatedAt: null,
      createdBy: 'admin1',
    },
    {
      id: 'monev-stbm',
      name: 'e-Monev STBM',
      url: 'https://stbm.kemkes.go.id',
      logoUrl: '',
      categoryId: 'kesling',
      description: 'Sanitasi Total Berbasis Masyarakat',
      isActive: true,
      displayOrder: 1,
      openCount: 5,
      createdAt: null,
      updatedAt: null,
      createdBy: 'admin1',
    },
    {
      id: 'inactive-app',
      name: 'Aplikasi Nonaktif',
      url: 'https://internal.puskesmas.id',
      logoUrl: '',
      categoryId: 'kemenkes',
      description: 'Sedang pemeliharaan',
      isActive: false,
      displayOrder: 0,
      openCount: 0,
      createdAt: null,
      updatedAt: null,
      createdBy: 'admin1',
    },
  ];

  // 1. Public view hides inactive apps and sorts by displayOrder ascending
  const allPublic = filterAndSortApplications({
    applications: apps,
    categories,
    searchQuery: '',
    selectedCategoryId: 'all',
    favoriteIds: [],
    onlyActive: true,
  });
  assert.equal(allPublic.length, 2);
  assert.equal(allPublic[0].id, 'monev-stbm');
  assert.equal(allPublic[1].id, 'satusehat');

  // 2. Search by category name matches apps in that category
  const searchByCategory = filterAndSortApplications({
    applications: apps,
    categories,
    searchQuery: 'Lingkungan',
    selectedCategoryId: 'all',
    favoriteIds: [],
    onlyActive: true,
  });
  assert.equal(searchByCategory.length, 1);
  assert.equal(searchByCategory[0].id, 'monev-stbm');

  // 3. Favorites toggle & filter
  let favs = toggleFavoriteId([], 'satusehat');
  assert.deepEqual(favs, ['satusehat']);
  const favFiltered = filterAndSortApplications({
    applications: apps,
    categories,
    searchQuery: '',
    selectedCategoryId: 'favorites',
    favoriteIds: favs,
    onlyActive: true,
  });
  assert.equal(favFiltered.length, 1);
  assert.equal(favFiltered[0].id, 'satusehat');
  favs = toggleFavoriteId(favs, 'satusehat');
  assert.deepEqual(favs, []);
});

test('Dirty Dozen Security Payloads all return PERMISSION_DENIED', () => {
  const now = 1762050000000;
  const baseAdminEnv: SimulatedRuleEnv = {
    auth: {
      uid: 'admin-uid-1',
      email: BOOTSTRAPPED_ADMIN_EMAIL,
      email_verified: true,
    },
    requestTime: now,
    existingCategories: new Set(['kemenkes']),
    existingAdmins: new Map([['admin-uid-1', { isActive: true, email: BOOTSTRAPPED_ADMIN_EMAIL }]]),
    existingDoc: null,
  };

  const validAppPayload = {
    id: 'app-1',
    name: 'SatuSehat',
    url: 'https://satusehat.kemkes.go.id',
    logoUrl: '',
    categoryId: 'kemenkes',
    description: 'Portal SatuSehat',
    isActive: true,
    displayOrder: 1,
    openCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: 'admin-uid-1',
  };

  // Sanity check: Valid admin create succeeds
  assert.equal(
    evaluateFirestoreRule('applications', 'create', 'app-1', validAppPayload, baseAdminEnv),
    'ALLOW'
  );

  // 1. Shadow Field Injection on Application Create
  assert.equal(
    evaluateFirestoreRule(
      'applications',
      'create',
      'app-1',
      { ...validAppPayload, isVerified: true },
      baseAdminEnv
    ),
    'PERMISSION_DENIED'
  );

  // 2. Unverified Bootstrapped Email Spoof
  assert.equal(
    evaluateFirestoreRule('applications', 'create', 'app-1', validAppPayload, {
      ...baseAdminEnv,
      auth: { uid: 'spoof-uid', email: BOOTSTRAPPED_ADMIN_EMAIL, email_verified: false },
    }),
    'PERMISSION_DENIED'
  );

  // 3. Public Scraping of Inactive Applications
  assert.equal(
    evaluateFirestoreRule('applications', 'list', 'app-1', null, {
      ...baseAdminEnv,
      auth: null,
      existingDoc: { isActive: false },
    }),
    'PERMISSION_DENIED'
  );

  // 4. Orphaned Application Creation (non-existent categoryId)
  assert.equal(
    evaluateFirestoreRule(
      'applications',
      'create',
      'app-1',
      { ...validAppPayload, categoryId: 'ghost-category' },
      baseAdminEnv
    ),
    'PERMISSION_DENIED'
  );

  // 5. Creator Identity Spoofing
  assert.equal(
    evaluateFirestoreRule(
      'applications',
      'create',
      'app-1',
      { ...validAppPayload, createdBy: 'other-admin-uid' },
      baseAdminEnv
    ),
    'PERMISSION_DENIED'
  );

  // 6. Timestamp Forgery (Backdating)
  assert.equal(
    evaluateFirestoreRule(
      'applications',
      'create',
      'app-1',
      { ...validAppPayload, createdAt: now - 50000 },
      baseAdminEnv
    ),
    'PERMISSION_DENIED'
  );

  // 7. Immutable Field Mutation on Update
  assert.equal(
    evaluateFirestoreRule(
      'applications',
      'update',
      'app-1',
      { ...validAppPayload, createdBy: 'hacked-owner' },
      { ...baseAdminEnv, existingDoc: validAppPayload }
    ),
    'PERMISSION_DENIED'
  );

  // 8. 1MB ID Poisoning Attack
  const poisonedId = 'a'.repeat(1500);
  assert.equal(isValidId(poisonedId), false);
  assert.equal(
    evaluateFirestoreRule('applications', 'get', poisonedId, null, baseAdminEnv),
    'PERMISSION_DENIED'
  );

  // 9. Value Poisoning on Whitelisted Update Key
  assert.equal(
    evaluateFirestoreRule(
      'applications',
      'update',
      'app-1',
      { ...validAppPayload, name: 'X'.repeat(500) },
      { ...baseAdminEnv, existingDoc: validAppPayload }
    ),
    'PERMISSION_DENIED'
  );

  // 10. Non-Admin Authenticated PII Read on /admins
  assert.equal(
    evaluateFirestoreRule('admins', 'get', 'admin-uid-1', null, {
      ...baseAdminEnv,
      auth: { uid: 'regular-user-uid', email: 'user@gmail.com', email_verified: true },
    }),
    'PERMISSION_DENIED'
  );

  // 11. Self-Privilege Escalation in /admins
  assert.equal(
    evaluateFirestoreRule(
      'admins',
      'create',
      'regular-user-uid',
      {
        uid: 'regular-user-uid',
        name: 'Attacker',
        email: 'user@gmail.com',
        role: 'super_admin',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: 'regular-user-uid',
      },
      {
        ...baseAdminEnv,
        auth: { uid: 'regular-user-uid', email: 'user@gmail.com', email_verified: true },
      }
    ),
    'PERMISSION_DENIED'
  );

  // 12. Audit Log Tampering (update/delete on /activity_logs)
  assert.equal(
    evaluateFirestoreRule('activity_logs', 'update', 'log-1', {}, baseAdminEnv),
    'PERMISSION_DENIED'
  );
  assert.equal(
    evaluateFirestoreRule('activity_logs', 'delete', 'log-1', null, baseAdminEnv),
    'PERMISSION_DENIED'
  );
});

test('External application launcher preserves exact database URL and enforces external browser target', () => {
  // Exact database URLs (including query params, subpaths, and ports) must never be mutated
  const exactBpjsUrl = 'https://pcarejkn.bpjs-kesehatan.go.id/eclaim/Login?mode=puskesmas#auth';
  const res1 = inspectExternalAppUrl(exactBpjsUrl, 'https://iniyandit-portal.run.app');
  assert.equal(res1.canLaunch, true);
  assert.equal(res1.targetUrl, exactBpjsUrl);
  assert.equal(res1.isExternalOrigin, true);
  assert.equal(res1.protocol, 'https:');

  // Unsafe pseudo-protocols must be rejected
  const unsafeJsUrl = inspectExternalAppUrl('javascript:alert(1)', 'https://iniyandit-portal.run.app');
  assert.equal(unsafeJsUrl.canLaunch, false);

  // External anchor attributes must specify _blank and noopener noreferrer external
  assert.equal(EXTERNAL_ANCHOR_PROPS.target, '_blank');
  assert.equal(EXTERNAL_ANCHOR_PROPS.rel, 'noopener noreferrer external');

  // Direct anchor click allows native out-of-scope browser tab launch
  let prevented = false;
  const anchorAllowed = handleExternalAppClick(
    {
      preventDefault: () => {
        prevented = true;
      },
      currentTarget: { tagName: 'A' } as unknown as HTMLElement,
    },
    exactBpjsUrl
  );
  assert.equal(anchorAllowed, true);
  assert.equal(prevented, false);
});

test('Desktop internal browser workspace manages multi-tab state, history navigation, and URL security', () => {
  // 1. Strict HTTP/HTTPS URL security validation
  const validHttps = validateSafeWorkspaceUrl('https://satusehat.kemkes.go.id/dashboard');
  assert.equal(validHttps.valid, true);
  assert.equal(validHttps.protocol, 'https:');
  assert.equal(validHttps.hostname, 'satusehat.kemkes.go.id');

  const blockedJs = validateSafeWorkspaceUrl('javascript:alert(document.cookie)');
  assert.equal(blockedJs.valid, false);

  const blockedFile = validateSafeWorkspaceUrl('file:///C:/Windows/System32/cmd.exe');
  assert.equal(blockedFile.valid, false);

  // 2. Popup policy routes valid HTTP/HTTPS popups to internal workspace tab and blocks unsafe protocols
  const safePopup = evaluatePopupPolicy('https://pcarejkn.bpjs-kesehatan.go.id/eclaim');
  assert.equal(safePopup.action, 'open-in-workspace-tab');
  const unsafePopup = evaluatePopupPolicy('data:text/html,<script>alert(1)</script>');
  assert.equal(unsafePopup.action, 'deny');

  // 3. Multi-tab opening, deduplication, navigation, and closing
  const app1: ApplicationItem = {
    id: 'sipandit',
    name: 'SIPANDIT',
    url: 'https://sipandit.iniyandit.id',
    logoUrl: '',
    categoryId: 'internal',
    description: 'Sistem Informasi Puskesmas Iniyandit',
    isActive: true,
    displayOrder: 1,
    openCount: 12,
    createdAt: null,
    updatedAt: null,
    createdBy: 'admin1',
  };

  const app2: ApplicationItem = {
    id: 'epuskesmas',
    name: 'e-Puskesmas',
    url: 'https://epuskesmas.id',
    logoUrl: '',
    categoryId: 'kemenkes',
    description: 'Pelayanan Kesehatan Digital',
    isActive: true,
    displayOrder: 2,
    openCount: 25,
    createdAt: null,
    updatedAt: null,
    createdBy: 'admin1',
  };

  const step1 = openOrFocusWorkspaceTab([], app1);
  assert.equal(step1.tabs.length, 1);
  assert.equal(step1.tabs[0].appId, 'sipandit');
  assert.equal(step1.activeTabId, step1.tabs[0].tabId);

  const step2 = openOrFocusWorkspaceTab(step1.tabs, app2);
  assert.equal(step2.tabs.length, 2);
  assert.equal(step2.tabs[1].appId, 'epuskesmas');
  assert.equal(step2.activeTabId, step2.tabs[1].tabId);

  // Clicking an already-open app focuses existing tab instead of duplicating
  const step3 = openOrFocusWorkspaceTab(step2.tabs, app1);
  assert.equal(step3.tabs.length, 2);
  assert.equal(step3.activeTabId, step1.tabs[0].tabId);

  // Navigate home, reload, back, and forward
  const sipanditTabId = step1.tabs[0].tabId;
  const epuskesmasTabId = step2.tabs[1].tabId;

  const navHome = navigateWorkspaceTab(step3.tabs, sipanditTabId, 'home');
  const tabAfterHome = navHome.find((t) => t.tabId === sipanditTabId)!;
  assert.equal(tabAfterHome.currentUrl, 'https://sipandit.iniyandit.id');
  assert.equal(tabAfterHome.history.length, 2);
  assert.equal(tabAfterHome.historyIndex, 1);

  const navBack = navigateWorkspaceTab(navHome, sipanditTabId, 'back');
  const tabAfterBack = navBack.find((t) => t.tabId === sipanditTabId)!;
  assert.equal(tabAfterBack.historyIndex, 0);

  const navForward = navigateWorkspaceTab(navBack, sipanditTabId, 'forward');
  const tabAfterForward = navForward.find((t) => t.tabId === sipanditTabId)!;
  assert.equal(tabAfterForward.historyIndex, 1);

  const navReload = navigateWorkspaceTab(navForward, sipanditTabId, 'reload');
  const tabAfterReload = navReload.find((t) => t.tabId === sipanditTabId)!;
  assert.equal(tabAfterReload.reloadKey > tabAfterForward.reloadKey, true);

  // Closing active tab selects adjacent open tab; closing last tab returns to 'dashboard'
  const afterClose1 = closeWorkspaceTab(navReload, sipanditTabId, sipanditTabId);
  assert.equal(afterClose1.tabs.length, 1);
  assert.equal(afterClose1.activeTabId, epuskesmasTabId);

  const afterClose2 = closeWorkspaceTab(afterClose1.tabs, afterClose1.activeTabId, epuskesmasTabId);
  assert.equal(afterClose2.tabs.length, 0);
  assert.equal(afterClose2.activeTabId, 'dashboard');
});

test('Iniyandit Smart Login validates inputs, manages saved/never_save/autofill states, and enforces compatibility & security rules', () => {
  // 1. Security warning constant matches mandatory notice
  assert.equal(
    SMART_LOGIN_SECURITY_NOTICE,
    'Password disimpan secara lokal pada perangkat ini untuk mempermudah login. Jangan menyimpan password pada komputer umum atau komputer yang digunakan bersama jika Anda tidak yakin dengan keamanan perangkat.'
  );

  // 2. Input validation rejects missing username/password
  const validCred = validateSmartLoginInput({
    appId: 'sipandit',
    username: 'petugas_iniyandit',
    password: 'RahasiaPuskesmas123!',
  });
  assert.equal(validCred.valid, true);

  const emptyPass = validateSmartLoginInput({
    appId: 'sipandit',
    username: 'petugas_iniyandit',
    password: '',
  });
  assert.equal(emptyPass.valid, false);

  // 3. State transitions: default 'ask' -> 'saved' -> toggle autofill -> 'never_save' -> remove
  const initialState = getAppSmartLoginState([], 'sipandit');
  assert.equal(initialState.status, 'ask');
  assert.equal(initialState.record, null);

  const savedMeta = {
    appId: 'sipandit',
    appName: 'SIPANDIT',
    appUrl: 'https://sipandit.iniyandit.id/login',
    policy: 'saved' as const,
    username: 'petugas_iniyandit',
    hasStoredPassword: true,
    autofillEnabled: true,
    updatedAt: 1762050000000,
    encryptionBackend: 'safeStorage+aes-256-gcm',
  };

  const afterSave = upsertCredentialMeta([], savedMeta);
  const savedState = getAppSmartLoginState(afterSave, 'sipandit');
  assert.equal(savedState.status, 'saved');
  assert.equal(savedState.record?.username, 'petugas_iniyandit');
  assert.equal(savedState.record?.autofillEnabled, true);

  // Toggle autofill off while keeping account saved
  const afterToggleOff = toggleCredentialAutofillMeta(afterSave, 'sipandit', false);
  const toggledState = getAppSmartLoginState(afterToggleOff, 'sipandit');
  assert.equal(toggledState.status, 'saved');
  assert.equal(toggledState.record?.autofillEnabled, false);

  // Removing account returns app to 'ask' state
  const afterDelete = removeCredentialMeta(afterToggleOff, 'sipandit');
  const deletedState = getAppSmartLoginState(afterDelete, 'sipandit');
  assert.equal(deletedState.status, 'ask');

  // 4. Login form compatibility evaluator enforces desktop runtime & safe URLs
  const compatElectron = evaluateAutofillCompatibility({
    appUrl: 'https://sipandit.iniyandit.id/login',
    currentTabUrl: 'https://sipandit.iniyandit.id/login',
    isElectronRuntime: true,
    record: savedMeta,
  });
  assert.equal(compatElectron.status, 'autofilled');

  const compatWebPreview = evaluateAutofillCompatibility({
    appUrl: 'https://sipandit.iniyandit.id/login',
    currentTabUrl: 'https://sipandit.iniyandit.id/login',
    isElectronRuntime: false,
    record: savedMeta,
  });
  assert.equal(compatWebPreview.status, 'incompatible');

  const compatUnsafeUrl = evaluateAutofillCompatibility({
    appUrl: 'javascript:alert(1)',
    currentTabUrl: 'javascript:alert(1)',
    isElectronRuntime: true,
    record: savedMeta,
  });
  assert.equal(compatUnsafeUrl.status, 'unsafe_url');
});

test('Full Screen mode shortcuts (F11, Escape, Ctrl+Shift+F) and WebContentsView bounds work accurately', () => {
  // 1. F11 toggles Full Screen when an application tab is active
  assert.equal(
    evaluateFullScreenShortcut(
      { key: 'F11' },
      { hasActiveAppTab: true, isFullScreen: false, hasModalOverlay: false }
    ),
    'toggle'
  );
  assert.equal(
    evaluateFullScreenShortcut(
      { key: 'F11' },
      { hasActiveAppTab: true, isFullScreen: true, hasModalOverlay: false }
    ),
    'toggle'
  );

  // 2. Ctrl + Shift + F toggles Full Screen
  assert.equal(
    evaluateFullScreenShortcut(
      { key: 'F', ctrlKey: true, shiftKey: true },
      { hasActiveAppTab: true, isFullScreen: false, hasModalOverlay: false }
    ),
    'toggle'
  );
  assert.equal(
    evaluateFullScreenShortcut(
      { key: 'f', ctrlKey: true, shiftKey: true },
      { hasActiveAppTab: true, isFullScreen: true, hasModalOverlay: false }
    ),
    'toggle'
  );

  // 3. Escape exits Full Screen ONLY when Full Screen is active (does not interfere with forms when not in Full Screen)
  assert.equal(
    evaluateFullScreenShortcut(
      { key: 'Escape' },
      { hasActiveAppTab: true, isFullScreen: true, hasModalOverlay: false }
    ),
    'exit'
  );
  assert.equal(
    evaluateFullScreenShortcut(
      { key: 'Escape' },
      { hasActiveAppTab: true, isFullScreen: false, hasModalOverlay: false }
    ),
    'none'
  );

  // 4. Shortcuts are ignored when on main dashboard (no active app tab) or when modal overlay is open
  assert.equal(
    evaluateFullScreenShortcut(
      { key: 'F11' },
      { hasActiveAppTab: false, isFullScreen: false, hasModalOverlay: false }
    ),
    'none'
  );
  assert.equal(
    evaluateFullScreenShortcut(
      { key: 'Escape' },
      { hasActiveAppTab: true, isFullScreen: true, hasModalOverlay: true }
    ),
    'none'
  );

  // 5. WebContentsView bounds fill 100% of window in Full Screen mode and restore container bounds on exit
  const normalBounds = computeWorkspaceViewportBounds({
    isFullScreen: false,
    windowWidth: 1440,
    windowHeight: 900,
    containerRect: { left: 288, top: 164, width: 1152, height: 736 },
  });
  assert.deepEqual(normalBounds, { x: 288, y: 164, width: 1152, height: 736 });

  const fullScreenBounds = computeWorkspaceViewportBounds({
    isFullScreen: true,
    windowWidth: 1920,
    windowHeight: 1080,
    containerRect: { left: 288, top: 164, width: 1152, height: 736 },
  });
  assert.deepEqual(fullScreenBounds, { x: 0, y: 0, width: 1920, height: 1080 });
});




