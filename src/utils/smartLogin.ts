import {
  IniyanditDesktopBridge,
  SmartLoginAutofillResult,
  SmartLoginCredentialMeta,
  validateSafeWorkspaceUrl,
} from './desktopWorkspace';

export const SMART_LOGIN_SECURITY_NOTICE =
  'Password disimpan secara lokal pada perangkat ini untuk mempermudah login. Jangan menyimpan password pada komputer umum atau komputer yang digunakan bersama jika Anda tidak yakin dengan keamanan perangkat.';

export interface SmartLoginValidationResult {
  valid: boolean;
  errors: {
    appId?: string;
    username?: string;
    password?: string;
  };
}

/**
 * Pure validation for Smart Login credential input before encrypting & saving.
 * Never logs or mutates the password.
 */
export function validateSmartLoginInput(input: {
  appId: string;
  username: string;
  password: string;
}): SmartLoginValidationResult {
  const errors: SmartLoginValidationResult['errors'] = {};

  if (!input.appId || input.appId.trim().length === 0) {
    errors.appId = 'Pilih aplikasi terlebih dahulu.';
  }

  const trimmedUsername = (input.username || '').trim();
  if (trimmedUsername.length === 0) {
    errors.username = 'Username / NIP / Email wajib diisi.';
  } else if (trimmedUsername.length > 160) {
    errors.username = 'Username terlalu panjang (maksimal 160 karakter).';
  }

  const rawPassword = input.password || '';
  if (rawPassword.length === 0) {
    errors.password = 'Password wajib diisi.';
  } else if (rawPassword.length > 256) {
    errors.password = 'Password terlalu panjang (maksimal 256 karakter).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Computes the Smart Login status for a specific application ID.
 * - 'ask': User has not decided yet; show optional prompt "Apakah Anda ingin menyimpan akun [Aplikasi]..."
 * - 'saved': User explicitly saved an account for this application
 * - 'never_save': User explicitly chose "Jangan simpan" for this application
 */
export function getAppSmartLoginState(
  credentials: SmartLoginCredentialMeta[],
  appId: string
): {
  status: 'ask' | 'saved' | 'never_save';
  record: SmartLoginCredentialMeta | null;
} {
  const found = credentials.find((c) => c.appId === appId) || null;
  if (!found) {
    return { status: 'ask', record: null };
  }
  return {
    status: found.policy === 'never_save' ? 'never_save' : 'saved',
    record: found,
  };
}

/**
 * Pure state reducer helpers for deterministic unit testing and state updates.
 */
export function upsertCredentialMeta(
  list: SmartLoginCredentialMeta[],
  nextItem: SmartLoginCredentialMeta
): SmartLoginCredentialMeta[] {
  const exists = list.some((item) => item.appId === nextItem.appId);
  if (exists) {
    return list.map((item) => (item.appId === nextItem.appId ? nextItem : item));
  }
  return [...list, nextItem];
}

export function toggleCredentialAutofillMeta(
  list: SmartLoginCredentialMeta[],
  appId: string,
  enabled: boolean
): SmartLoginCredentialMeta[] {
  return list.map((item) =>
    item.appId === appId && item.policy === 'saved'
      ? { ...item, autofillEnabled: enabled, updatedAt: Date.now() }
      : item
  );
}

export function removeCredentialMeta(
  list: SmartLoginCredentialMeta[],
  appId: string
): SmartLoginCredentialMeta[] {
  return list.filter((item) => item.appId !== appId);
}

/**
 * Evaluates whether a target application URL and runtime environment support automatic DOM autofill.
 * Never attempts cross-origin script injection in standard web preview iframes; reserves direct
 * DOM input population for Electron `WebContentsView` on matching HTTP/HTTPS origins.
 */
export function evaluateAutofillCompatibility(params: {
  appUrl: string;
  currentTabUrl: string;
  isElectronRuntime: boolean;
  record: SmartLoginCredentialMeta | null;
}): SmartLoginAutofillResult {
  const { appUrl, currentTabUrl, isElectronRuntime, record } = params;

  if (!record || record.policy !== 'saved' || !record.hasStoredPassword) {
    return {
      status: 'no_credential',
      message: 'Belum ada akun tersimpan untuk aplikasi ini.',
    };
  }

  if (!record.autofillEnabled) {
    return {
      status: 'disabled',
      message: 'Autofill sedang dinonaktifkan untuk aplikasi ini. Anda dapat mengaktifkannya kapan saja.',
    };
  }

  const safeTarget = validateSafeWorkspaceUrl(currentTabUrl || appUrl);
  if (!safeTarget.valid) {
    return {
      status: 'unsafe_url',
      message: 'URL tujuan tidak aman untuk pengisian otomatis.',
    };
  }

  if (!isElectronRuntime) {
    return {
      status: 'incompatible',
      message:
        'Pada mode pratinjau browser, kebijakan keamanan lintas-domain (Same-Origin Policy) membatasi autofill otomatis ke website eksternal. Gunakan aplikasi Desktop Windows (.exe) untuk autofill otomatis penuh, atau salin username di bawah untuk login manual.',
    };
  }

  return {
    status: 'autofilled',
    filledUsername: true,
    filledPassword: true,
    message:
      'Username dan password telah diisi otomatis pada form login yang kompatibel. Silakan periksa kembali lalu tekan tombol Login.',
  };
}

/**
 * Web Crypto AES-256-GCM Encrypted Vault for Browser Preview Environment
 * - Never stores plaintext passwords
 * - Never stores passwords in localStorage or Firebase
 * - Uses IndexedDB with non-extractable Web Crypto AES-GCM 256-bit key (and in-memory fallback)
 */
interface EncryptedWebVaultEntry extends SmartLoginCredentialMeta {
  ivBase64?: string;
  cipherBase64?: string;
}

const IDB_NAME = 'iniyandit_smart_login_secure_db';
const IDB_STORE_KEYS = 'crypto_keys';
const IDB_STORE_ENTRIES = 'encrypted_credentials';
const MASTER_KEY_ID = 'local_device_aes_gcm_256';

const memoryFallbackStore = new Map<string, EncryptedWebVaultEntry>();
let memoryCryptoKeyPromise: Promise<CryptoKey> | null = null;

function openSecureIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE_KEYS)) {
          db.createObjectStore(IDB_STORE_KEYS);
        }
        if (!db.objectStoreNames.contains(IDB_STORE_ENTRIES)) {
          db.createObjectStore(IDB_STORE_ENTRIES, { keyPath: 'appId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getOrCreateWebCryptoKey(): Promise<CryptoKey> {
  const db = await openSecureIndexedDb();
  if (db) {
    const existingKey = await new Promise<CryptoKey | null>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_KEYS, 'readonly');
        const req = tx.objectStore(IDB_STORE_KEYS).get(MASTER_KEY_ID);
        req.onsuccess = () => resolve((req.result as CryptoKey) || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    if (existingKey) {
      db.close();
      return existingKey;
    }
  }

  if (!memoryCryptoKeyPromise) {
    memoryCryptoKeyPromise = window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable key!
      ['encrypt', 'decrypt']
    );
  }
  const newKey = await memoryCryptoKeyPromise;

  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_KEYS, 'readwrite');
        tx.objectStore(IDB_STORE_KEYS).put(newKey, MASTER_KEY_ID);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
    db.close();
  }

  return newKey;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function encryptPasswordWebCrypto(plainPassword: string): Promise<{
  ivBase64: string;
  cipherBase64: string;
}> {
  const key = await getOrCreateWebCryptoKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainPassword);
  const cipherBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    ivBase64: bytesToBase64(iv),
    cipherBase64: bytesToBase64(new Uint8Array(cipherBuffer)),
  };
}

function sanitizeEntry(entry: EncryptedWebVaultEntry): SmartLoginCredentialMeta {
  return {
    appId: entry.appId,
    appName: entry.appName,
    appUrl: entry.appUrl,
    username: entry.username,
    autofillEnabled: entry.autofillEnabled,
    policy: entry.policy,
    hasStoredPassword: entry.hasStoredPassword,
    updatedAt: entry.updatedAt,
  };
}

export async function listSmartLoginCredentials(
  bridge: IniyanditDesktopBridge | null
): Promise<SmartLoginCredentialMeta[]> {
  if (bridge?.listSavedCredentials) {
    return bridge.listSavedCredentials();
  }

  const db = await openSecureIndexedDb();
  if (!db) {
    return Array.from(memoryFallbackStore.values()).map(sanitizeEntry);
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_ENTRIES, 'readonly');
      const req = tx.objectStore(IDB_STORE_ENTRIES).getAll();
      req.onsuccess = () => {
        db.close();
        const rows = (req.result as EncryptedWebVaultEntry[]) || [];
        resolve(rows.map(sanitizeEntry));
      };
      req.onerror = () => {
        db.close();
        resolve(Array.from(memoryFallbackStore.values()).map(sanitizeEntry));
      };
    } catch {
      db.close();
      resolve(Array.from(memoryFallbackStore.values()).map(sanitizeEntry));
    }
  });
}

export async function saveSmartLoginCredential(
  bridge: IniyanditDesktopBridge | null,
  payload: {
    appId: string;
    appName: string;
    appUrl: string;
    username: string;
    password: string;
    autofillEnabled: boolean;
  }
): Promise<{ ok: boolean; error?: string; item?: SmartLoginCredentialMeta }> {
  const validation = validateSmartLoginInput(payload);
  if (!validation.valid) {
    const firstErr =
      validation.errors.appId || validation.errors.username || validation.errors.password;
    return { ok: false, error: firstErr || 'Data kredensial tidak valid.' };
  }

  if (bridge?.saveCredential) {
    return bridge.saveCredential(payload);
  }

  const encrypted = await encryptPasswordWebCrypto(payload.password);
  const now = Date.now();
  const entry: EncryptedWebVaultEntry = {
    appId: payload.appId,
    appName: payload.appName.trim(),
    appUrl: payload.appUrl.trim(),
    username: payload.username.trim(),
    autofillEnabled: payload.autofillEnabled,
    policy: 'saved',
    hasStoredPassword: true,
    updatedAt: now,
    ivBase64: encrypted.ivBase64,
    cipherBase64: encrypted.cipherBase64,
  };

  memoryFallbackStore.set(entry.appId, entry);

  const db = await openSecureIndexedDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_ENTRIES, 'readwrite');
        tx.objectStore(IDB_STORE_ENTRIES).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
    db.close();
  }

  return { ok: true, item: sanitizeEntry(entry) };
}

export async function setSmartLoginNeverSave(
  bridge: IniyanditDesktopBridge | null,
  payload: { appId: string; appName: string; appUrl: string }
): Promise<{ ok: boolean; item: SmartLoginCredentialMeta }> {
  if (bridge?.setNeverSavePolicy) {
    await bridge.setNeverSavePolicy(payload);
  }

  const now = Date.now();
  const entry: EncryptedWebVaultEntry = {
    appId: payload.appId,
    appName: payload.appName,
    appUrl: payload.appUrl,
    username: '',
    autofillEnabled: false,
    policy: 'never_save',
    hasStoredPassword: false,
    updatedAt: now,
  };

  memoryFallbackStore.set(entry.appId, entry);

  const db = await openSecureIndexedDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_ENTRIES, 'readwrite');
        tx.objectStore(IDB_STORE_ENTRIES).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
    db.close();
  }

  return { ok: true, item: sanitizeEntry(entry) };
}

export async function toggleSmartLoginAutofill(
  bridge: IniyanditDesktopBridge | null,
  appId: string,
  enabled: boolean
): Promise<{ ok: boolean }> {
  if (bridge?.setAutofillEnabled) {
    await bridge.setAutofillEnabled(appId, enabled);
    return { ok: true };
  }

  const mem = memoryFallbackStore.get(appId);
  if (mem) {
    mem.autofillEnabled = enabled;
    mem.updatedAt = Date.now();
    memoryFallbackStore.set(appId, mem);
  }

  const db = await openSecureIndexedDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_ENTRIES, 'readwrite');
        const store = tx.objectStore(IDB_STORE_ENTRIES);
        const getReq = store.get(appId);
        getReq.onsuccess = () => {
          const existing = getReq.result as EncryptedWebVaultEntry | undefined;
          if (existing) {
            existing.autofillEnabled = enabled;
            existing.updatedAt = Date.now();
            store.put(existing);
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
    db.close();
  }

  return { ok: true };
}

export async function deleteSmartLoginCredential(
  bridge: IniyanditDesktopBridge | null,
  appId: string
): Promise<{ ok: boolean }> {
  if (bridge?.deleteCredential) {
    await bridge.deleteCredential(appId);
    return { ok: true };
  }

  memoryFallbackStore.delete(appId);

  const db = await openSecureIndexedDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_ENTRIES, 'readwrite');
        tx.objectStore(IDB_STORE_ENTRIES).delete(appId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
    db.close();
  }

  return { ok: true };
}

export async function clearAllSmartLoginCredentials(
  bridge: IniyanditDesktopBridge | null
): Promise<{ ok: boolean }> {
  if (bridge?.clearAllCredentials) {
    await bridge.clearAllCredentials();
    return { ok: true };
  }

  memoryFallbackStore.clear();

  const db = await openSecureIndexedDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_ENTRIES, 'readwrite');
        tx.objectStore(IDB_STORE_ENTRIES).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
    db.close();
  }

  return { ok: true };
}
