/**
 * Electron Preload Script — Iniyandit Application Center
 * Exposes a strictly scoped API via contextBridge with contextIsolation: true,
 * nodeIntegration: false, and sandbox: true. Never exposes Node.js or raw ipcRenderer.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('iniyanditDesktop', {
  isElectron: true,
  platform: process.platform,

  openTab: (payload) => ipcRenderer.invoke('workspace:open-tab', payload),
  switchTab: (tabId) => ipcRenderer.invoke('workspace:switch-tab', tabId),
  closeTab: (tabId) => ipcRenderer.invoke('workspace:close-tab', tabId),
  setBounds: (bounds) => ipcRenderer.invoke('workspace:set-bounds', bounds),
  setOverlayVisible: (visible) => ipcRenderer.invoke('workspace:set-overlay-visible', visible),

  goBack: (tabId) => ipcRenderer.invoke('workspace:nav-back', tabId),
  goForward: (tabId) => ipcRenderer.invoke('workspace:nav-forward', tabId),
  reload: (tabId) => ipcRenderer.invoke('workspace:nav-reload', tabId),
  goHome: (tabId, initialUrl) => ipcRenderer.invoke('workspace:nav-home', { tabId, initialUrl }),

  openExternal: (url) => ipcRenderer.invoke('workspace:open-external', url),

  // Full Screen Mode (Per Active Application Tab)
  setFullScreen: (flag) => ipcRenderer.invoke('workspace:set-fullscreen', Boolean(flag)),
  toggleFullScreen: () => ipcRenderer.invoke('workspace:toggle-fullscreen'),
  getFullScreenState: () => ipcRenderer.invoke('workspace:get-fullscreen'),

  // Iniyandit Smart Login (Encrypted Local Credential Assistant)
  listSavedCredentials: () => ipcRenderer.invoke('smartlogin:list'),
  saveCredential: (payload) => ipcRenderer.invoke('smartlogin:save', payload),
  setNeverSavePolicy: (payload) => ipcRenderer.invoke('smartlogin:never-save', payload),
  setAutofillEnabled: (appId, enabled) =>
    ipcRenderer.invoke('smartlogin:toggle-autofill', { appId, enabled }),
  deleteCredential: (appId) => ipcRenderer.invoke('smartlogin:delete', appId),
  clearAllCredentials: () => ipcRenderer.invoke('smartlogin:clear-all'),
  triggerAutofill: (tabId, appId) =>
    ipcRenderer.invoke('smartlogin:autofill-tab', { tabId, appId }),

  onTabStateChange: (callback) => {
    const listener = (_event, state) => {
      if (typeof callback === 'function') callback(state);
    };
    ipcRenderer.on('workspace:tab-state', listener);
    return () => ipcRenderer.removeListener('workspace:tab-state', listener);
  },

  onPopupTabRequest: (callback) => {
    const listener = (_event, payload) => {
      if (typeof callback === 'function') callback(payload);
    };
    ipcRenderer.on('workspace:popup-tab', listener);
    return () => ipcRenderer.removeListener('workspace:popup-tab', listener);
  },

  onAutofillResult: (callback) => {
    const listener = (_event, payload) => {
      if (typeof callback === 'function') callback(payload);
    };
    ipcRenderer.on('smartlogin:autofill-result', listener);
    return () => ipcRenderer.removeListener('smartlogin:autofill-result', listener);
  },

  onFullScreenChange: (callback) => {
    const listener = (_event, payload) => {
      if (typeof callback === 'function') callback(payload);
    };
    ipcRenderer.on('workspace:fullscreen-changed', listener);
    return () => ipcRenderer.removeListener('workspace:fullscreen-changed', listener);
  },
});
