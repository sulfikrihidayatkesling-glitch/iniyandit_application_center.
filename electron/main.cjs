/**
 * Electron Main Process — Iniyandit Application Center
 * Uses BrowserWindow for the main portal dashboard, modern WebContentsView
 * for rendering external healthcare web applications inside the desktop workspace,
 * and LocalCredentialVault (safeStorage + AES-256-GCM) for optional Smart Login.
 */

const {
  app,
  BrowserWindow,
  WebContentsView,
  ipcMain,
  shell,
  session,
  safeStorage,
} = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { validateSafeUrl, createExternalViewWebPreferences } = require('./security.cjs');
const { LocalCredentialVault, buildSafeAutofillScript } = require('./credentialVault.cjs');

let mainWindow = null;
let credentialVault = null;
let localPortalServer = null;
let localPortalUrl = null;

/** @type {Map<string, { view: WebContentsView, initialUrl: string, title: string, appId: string }>} */
const tabViews = new Map();
let activeTabId = 'dashboard';
let overlayVisible = false;
let isWorkspaceFullScreen = false;
let currentBounds = { x: 280, y: 148, width: 1000, height: 700 };

function getVault() {
  if (!credentialVault) {
    credentialVault = new LocalCredentialVault({
      userDataPath: app.getPath('userData'),
      safeStorage,
    });
  }
  return credentialVault;
}

function syncFullScreenExitPillInView(view, showPill, appTitle) {
  if (!view || !view.webContents || view.webContents.isDestroyed()) return;
  const safeTitle = JSON.stringify(String(appTitle || 'Aplikasi'));
  const script = showPill
    ? `(function() {
        try {
          var id = '__iniyandit_fullscreen_exit_pill__';
          var existing = document.getElementById(id);
          if (existing) return;
          var btn = document.createElement('button');
          btn.id = id;
          btn.type = 'button';
          btn.title = 'Keluar dari Mode Layar Penuh (Tekan Esc atau F11)';
          btn.textContent = '⛶ Keluar Full Screen (' + ${safeTitle} + ' • Esc)';
          btn.setAttribute('style', [
            'position:fixed',
            'top:10px',
            'right:14px',
            'z-index:2147483647',
            'padding:6px 12px',
            'border-radius:9999px',
            'background:rgba(15,23,42,0.78)',
            'color:#ffffff',
            'border:1px solid rgba(20,184,166,0.55)',
            'font:600 11px/1.2 system-ui,-apple-system,sans-serif',
            'cursor:pointer',
            'box-shadow:0 4px 12px rgba(0,0,0,0.22)',
            'backdrop-filter:blur(6px)',
            'opacity:0.78',
            'transition:opacity 0.15s ease'
          ].join(';'));
          btn.onmouseenter = function() { btn.style.opacity = '1'; };
          btn.onmouseleave = function() { btn.style.opacity = '0.78'; };
          btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            document.title = '__INIYANDIT_EXIT_FULLSCREEN__:' + document.title;
          };
          (document.body || document.documentElement).appendChild(btn);
        } catch (_e) {}
      })();`
    : `(function() {
        try {
          var existing = document.getElementById('__iniyandit_fullscreen_exit_pill__');
          if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        } catch (_e) {}
      })();`;
  view.webContents.executeJavaScript(script, true).catch(() => {});
}

function setWorkspaceFullScreen(nextFlag) {
  const targetFlag = activeTabId === 'dashboard' ? false : Boolean(nextFlag);
  isWorkspaceFullScreen = targetFlag;

  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      if (mainWindow.isFullScreen() !== targetFlag) {
        mainWindow.setFullScreen(targetFlag);
      }
    } catch {
      // ignore window fullscreen transition errors
    }
    mainWindow.webContents.send('workspace:fullscreen-changed', {
      isFullScreen: isWorkspaceFullScreen,
    });
  }

  updateActiveViewLayout();
  return { ok: true, isFullScreen: isWorkspaceFullScreen };
}

function attachFullScreenShortcutsToWebContents(wc) {
  if (!wc || wc.isDestroyed()) return;
  wc.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (activeTabId === 'dashboard' || overlayVisible) return;

    const key = String(input.key || '');
    const isF11 = key === 'F11';
    const isCtrlShiftF =
      (input.control || input.meta) &&
      input.shift &&
      !input.alt &&
      key.toLowerCase() === 'f';
    const isEscape = key === 'Escape' && isWorkspaceFullScreen;

    if (isF11 || isCtrlShiftF) {
      event.preventDefault();
      setWorkspaceFullScreen(!isWorkspaceFullScreen);
    } else if (isEscape) {
      event.preventDefault();
      setWorkspaceFullScreen(false);
    }
  });
}

function emitTabState(tabId, view) {
  if (!mainWindow || mainWindow.isDestroyed() || !view) return;
  const wc = view.webContents;
  if (!wc || wc.isDestroyed()) return;

  const canGoBack = wc.navigationHistory
    ? wc.navigationHistory.canGoBack()
    : wc.canGoBack();
  const canGoForward = wc.navigationHistory
    ? wc.navigationHistory.canGoForward()
    : wc.canGoForward();

  mainWindow.webContents.send('workspace:tab-state', {
    tabId,
    url: wc.getURL(),
    title: wc.getTitle(),
    isLoading: wc.isLoading(),
    canGoBack,
    canGoForward,
  });
}

async function runSafeAutofillOnTab(tabId, appId, forceManualTrigger = false) {
  const entry = tabViews.get(tabId);
  if (!entry || !entry.view || entry.view.webContents.isDestroyed()) {
    return { status: 'no_tab', message: 'Tab aplikasi tidak ditemukan.' };
  }

  const targetAppId = appId || entry.appId;
  if (!targetAppId) {
    return { status: 'no_app', message: 'Identitas aplikasi tidak ditemukan.' };
  }

  const vault = getVault();
  const decrypted = vault.getDecryptedForAutofill(targetAppId);
  if (!decrypted) {
    return { status: 'no_credential', message: 'Belum ada akun tersimpan untuk aplikasi ini.' };
  }

  if (!decrypted.autofillEnabled && !forceManualTrigger) {
    return { status: 'disabled', message: 'Autofill dinonaktifkan untuk aplikasi ini.' };
  }

  const wc = entry.view.webContents;
  const currentUrl = wc.getURL();
  const safeCheck = validateSafeUrl(currentUrl);
  if (!safeCheck.valid) {
    return { status: 'unsafe_url', message: 'URL halaman tidak valid untuk autofill.' };
  }

  try {
    const script = buildSafeAutofillScript(decrypted.username, decrypted.password);
    const result = await wc.executeJavaScript(script, true);
    if (mainWindow && !mainWindow.isDestroyed() && result) {
      mainWindow.webContents.send('smartlogin:autofill-result', {
        tabId,
        appId: targetAppId,
        ...result,
      });
    }
    return result || { status: 'incompatible', message: 'Form login tidak kompatibel.' };
  } catch {
    const fallback = {
      status: 'incompatible',
      message:
        'Form login pada website ini tidak kompatibel untuk autofill otomatis. Silakan login secara manual.',
    };
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('smartlogin:autofill-result', {
        tabId,
        appId: targetAppId,
        ...fallback,
      });
    }
    return fallback;
  }
}

function updateActiveViewLayout() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const contentBounds = mainWindow.getContentBounds();

  for (const [tabId, entry] of tabViews.entries()) {
    const targetBounds = isWorkspaceFullScreen
      ? {
          x: 0,
          y: 0,
          width: Math.max(100, contentBounds.width),
          height: Math.max(100, contentBounds.height),
        }
      : {
          x: Math.round(currentBounds.x),
          y: Math.round(currentBounds.y),
          width: Math.round(currentBounds.width),
          height: Math.round(currentBounds.height),
        };

    const shouldShow =
      !overlayVisible &&
      activeTabId !== 'dashboard' &&
      tabId === activeTabId &&
      targetBounds.width > 10 &&
      targetBounds.height > 10;

    if (shouldShow) {
      entry.view.setVisible(true);
      entry.view.setBounds(targetBounds);
      syncFullScreenExitPillInView(entry.view, isWorkspaceFullScreen, entry.title);
    } else {
      entry.view.setVisible(false);
    }
  }
}

function createOrGetTabView(tabId, initialUrl, title, appId) {
  if (tabViews.has(tabId)) {
    const existing = tabViews.get(tabId);
    if (appId && !existing.appId) existing.appId = appId;
    return existing;
  }

  const view = new WebContentsView({
    webPreferences: createExternalViewWebPreferences(),
  });

  mainWindow.contentView.addChildView(view);
  view.setVisible(false);

  const wc = view.webContents;
  attachFullScreenShortcutsToWebContents(wc);

  // User-Agent compatible with modern government healthcare portals (Kemenkes, BPJS, SIPANDIT)
  const cleanUa = wc
    .getUserAgent()
    .replace(/\sElectron\/[^\s]+/, '')
    .replace(/\siniyandit-application-center\/[^\s]+/i, '');
  wc.setUserAgent(cleanUa);

  // Restrict navigation strictly to HTTP and HTTPS
  wc.on('will-navigate', (event, targetUrl) => {
    const check = validateSafeUrl(targetUrl);
    if (!check.valid) {
      event.preventDefault();
    }
  });

  wc.on('will-redirect', (event, targetUrl) => {
    const check = validateSafeUrl(targetUrl);
    if (!check.valid) {
      event.preventDefault();
    }
  });

  // Handle popups safely: route valid HTTP/HTTPS popups into an internal workspace tab
  wc.setWindowOpenHandler(({ url }) => {
    const check = validateSafeUrl(url);
    if (check.valid && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('workspace:popup-tab', {
        url: check.url,
        sourceTabId: tabId,
      });
    }
    return { action: 'deny' };
  });

  wc.on('did-start-loading', () => emitTabState(tabId, view));
  wc.on('did-stop-loading', () => {
    emitTabState(tabId, view);
    const currentEntry = tabViews.get(tabId);
    if (currentEntry) {
      syncFullScreenExitPillInView(view, isWorkspaceFullScreen && activeTabId === tabId, currentEntry.title);
      if (currentEntry.appId) {
        runSafeAutofillOnTab(tabId, currentEntry.appId, false).catch(() => {});
      }
    }
  });
  wc.on('did-navigate', () => emitTabState(tabId, view));
  wc.on('did-navigate-in-page', () => emitTabState(tabId, view));
  wc.on('page-title-updated', (_event, newTitle) => {
    if (typeof newTitle === 'string' && newTitle.startsWith('__INIYANDIT_EXIT_FULLSCREEN__:')) {
      setWorkspaceFullScreen(false);
      return;
    }
    emitTabState(tabId, view);
  });

  wc.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    // Ignore aborted loads (-3) triggered by fast redirects
    if (!isMainFrame || errorCode === -3) return;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('workspace:tab-state', {
        tabId,
        url: validatedURL,
        isLoading: false,
        hasError: true,
        errorCode,
        errorDescription:
          errorDescription || 'Website menolak koneksi atau gagal dimuat di dalam aplikasi.',
      });
    }
  });

  const entry = { view, initialUrl, title: title || 'Aplikasi', appId: appId || '' };
  tabViews.set(tabId, entry);
  wc.loadURL(initialUrl).catch(() => {});

  return entry;
}

function setupWorkspaceSessionSecurity() {
  const wsSession = session.fromPartition('persist:iniyandit-workspace');

  // Deny invasive hardware/desktop permissions from external websites by default
  wsSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const safePermissions = new Set(['fullscreen', 'clipboard-sanitized-write']);
    callback(safePermissions.has(permission));
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function ensureLocalPortalServer(distDir) {
  if (localPortalUrl) return Promise.resolve(localPortalUrl);

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url || '/', 'http://localhost');
        const rawPathname = decodeURIComponent(parsedUrl.pathname || '/');
        const safeRelPath = path.normalize(rawPathname).replace(/^(\.\.(\/|\\|$))+/, '');
        let targetPath = path.join(distDir, safeRelPath);

        if (!targetPath.startsWith(distDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
          targetPath = path.join(targetPath, 'index.html');
        }

        if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
          // SPA fallback for React Router paths (/admin/login, /admin/dashboard, etc.)
          targetPath = path.join(distDir, 'index.html');
        }

        const ext = path.extname(targetPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'X-Content-Type-Options': 'nosniff',
        });
        fs.createReadStream(targetPath).pipe(res);
      } catch {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });

    server.on('error', (err) => {
      reject(err);
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        localPortalServer = server;
        localPortalUrl = `http://localhost:${address.port}`;
        resolve(localPortalUrl);
      } else {
        reject(new Error('Failed to bind local portal server'));
      }
    });
  });
}

function createMainWindow() {
  setupWorkspaceSessionSecurity();
  getVault();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'Iniyandit Application Center — UPTD Puskesmas Iniyandit',
    icon: path.join(__dirname, '../public/favicon.ico'),
    backgroundColor: '#F8FAFC',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  attachFullScreenShortcutsToWebContents(mainWindow.webContents);

  mainWindow.on('resize', () => {
    updateActiveViewLayout();
  });

  mainWindow.on('enter-full-screen', () => {
    if (activeTabId !== 'dashboard' && !isWorkspaceFullScreen) {
      isWorkspaceFullScreen = true;
      mainWindow.webContents.send('workspace:fullscreen-changed', { isFullScreen: true });
      updateActiveViewLayout();
    }
  });

  mainWindow.on('leave-full-screen', () => {
    if (isWorkspaceFullScreen) {
      isWorkspaceFullScreen = false;
      mainWindow.webContents.send('workspace:fullscreen-changed', { isFullScreen: false });
      updateActiveViewLayout();
    }
  });

  const devServerUrl = process.env.ELECTRON_START_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    const distDir = path.join(__dirname, '../dist');
    ensureLocalPortalServer(distDir)
      .then((portalUrl) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(portalUrl);
        }
      })
      .catch(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadFile(path.join(distDir, 'index.html'));
        }
      });
  }

  mainWindow.on('closed', () => {
    for (const [, entry] of tabViews.entries()) {
      try {
        entry.view.webContents.close();
      } catch {
        // ignore cleanup error
      }
    }
    tabViews.clear();
    mainWindow = null;
  });
}

// IPC Handlers for WebContentsView Multi-Tab Management
ipcMain.handle('workspace:open-tab', (_event, payload) => {
  const { tabId, url, title, appId } = payload || {};
  const check = validateSafeUrl(url);
  if (!check.valid) {
    return { ok: false, error: check.reason };
  }
  createOrGetTabView(tabId, check.url, title, appId);
  activeTabId = tabId;
  updateActiveViewLayout();
  return { ok: true };
});

ipcMain.handle('workspace:switch-tab', (_event, tabId) => {
  activeTabId = tabId || 'dashboard';
  if (activeTabId === 'dashboard' && isWorkspaceFullScreen) {
    setWorkspaceFullScreen(false);
    return;
  }
  updateActiveViewLayout();
});

ipcMain.handle('workspace:close-tab', (_event, tabId) => {
  const entry = tabViews.get(tabId);
  if (entry && mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.contentView.removeChildView(entry.view);
      entry.view.webContents.close();
    } catch {
      // ignore cleanup error
    }
    tabViews.delete(tabId);
  }
  if (activeTabId === tabId) {
    activeTabId = 'dashboard';
    if (isWorkspaceFullScreen) {
      setWorkspaceFullScreen(false);
      return;
    }
  }
  updateActiveViewLayout();
});

ipcMain.handle('workspace:set-bounds', (_event, bounds) => {
  if (bounds && typeof bounds.width === 'number' && typeof bounds.height === 'number') {
    currentBounds = bounds;
    updateActiveViewLayout();
  }
});

ipcMain.handle('workspace:set-overlay-visible', (_event, visible) => {
  overlayVisible = Boolean(visible);
  updateActiveViewLayout();
});

ipcMain.handle('workspace:set-fullscreen', (_event, flag) => {
  return setWorkspaceFullScreen(Boolean(flag));
});

ipcMain.handle('workspace:toggle-fullscreen', () => {
  return setWorkspaceFullScreen(!isWorkspaceFullScreen);
});

ipcMain.handle('workspace:get-fullscreen', () => {
  return { isFullScreen: isWorkspaceFullScreen };
});

ipcMain.handle('workspace:nav-back', (_event, tabId) => {
  const entry = tabViews.get(tabId);
  if (!entry) return;
  const wc = entry.view.webContents;
  const canBack = wc.navigationHistory ? wc.navigationHistory.canGoBack() : wc.canGoBack();
  if (canBack) wc.goBack();
});

ipcMain.handle('workspace:nav-forward', (_event, tabId) => {
  const entry = tabViews.get(tabId);
  if (!entry) return;
  const wc = entry.view.webContents;
  const canForward = wc.navigationHistory
    ? wc.navigationHistory.canGoForward()
    : wc.canGoForward();
  if (canForward) wc.goForward();
});

ipcMain.handle('workspace:nav-reload', (_event, tabId) => {
  const entry = tabViews.get(tabId);
  if (entry) entry.view.webContents.reload();
});

ipcMain.handle('workspace:nav-home', (_event, { tabId, initialUrl }) => {
  const entry = tabViews.get(tabId);
  const targetUrl = initialUrl || entry?.initialUrl;
  const check = validateSafeUrl(targetUrl);
  if (entry && check.valid) {
    entry.view.webContents.loadURL(check.url);
  }
});

ipcMain.handle('workspace:open-external', async (_event, url) => {
  const check = validateSafeUrl(url);
  if (!check.valid) return false;
  await shell.openExternal(check.url);
  return true;
});

// IPC Handlers for Iniyandit Smart Login (Local Encrypted Credential Vault)
ipcMain.handle('smartlogin:list', () => {
  return getVault().listSanitizedCredentials();
});

ipcMain.handle('smartlogin:save', (_event, payload) => {
  return getVault().saveCredential(payload || {});
});

ipcMain.handle('smartlogin:never-save', (_event, payload) => {
  return getVault().setNeverSavePolicy(payload || {});
});

ipcMain.handle('smartlogin:toggle-autofill', (_event, { appId, enabled }) => {
  return getVault().setAutofillEnabled(appId, enabled);
});

ipcMain.handle('smartlogin:delete', (_event, appId) => {
  return getVault().deleteCredential(appId);
});

ipcMain.handle('smartlogin:clear-all', () => {
  return getVault().clearAllCredentials();
});

ipcMain.handle('smartlogin:autofill-tab', async (_event, { tabId, appId }) => {
  return runSafeAutofillOnTab(tabId, appId, true);
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
