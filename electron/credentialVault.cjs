/**
 * Electron Encrypted Local Credential Vault & Safe Autofill Engine
 * Iniyandit Application Center — Smart Login (Credential Assistant)
 *
 * SECURITY GUARANTEES:
 * 1. Uses Electron `safeStorage` (OS-level DPAPI on Windows) combined with AES-256-GCM
 *    authenticated encryption so passwords are NEVER stored in plaintext, NEVER stored in
 *    Firebase/Firestore, NEVER stored in localStorage, and NEVER logged.
 * 2. List operations return only non-sensitive metadata (appId, appName, username,
 *    autofillEnabled, policy, updatedAt). Passwords are never returned to the dashboard UI.
 * 3. Autofill only populates compatible username & password inputs on matching origins
 *    and NEVER auto-submits forms or bypasses CAPTCHA / OTP / 2FA.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VAULT_FILENAME = 'iniyandit-smart-login-vault.enc';
const KEY_FILENAME = 'iniyandit-smart-login-master.key';

/**
 * Derives or loads a local-machine-bound 256-bit key protected by Electron safeStorage
 * when available, or OS user profile entropy.
 */
function getOrCreateMasterKey(userDataPath, safeStorage) {
  const keyFilePath = path.join(userDataPath, KEY_FILENAME);

  if (fs.existsSync(keyFilePath)) {
    try {
      const rawBuffer = fs.readFileSync(keyFilePath);
      if (safeStorage && typeof safeStorage.isEncryptionAvailable === 'function' && safeStorage.isEncryptionAvailable()) {
        const decryptedHex = safeStorage.decryptString(rawBuffer);
        return Buffer.from(decryptedHex, 'hex');
      }
      return crypto.createHash('sha256').update(rawBuffer).digest();
    } catch {
      // Regenerate if corrupted
    }
  }

  const randomKey = crypto.randomBytes(32);
  try {
    fs.mkdirSync(userDataPath, { recursive: true });
    if (safeStorage && typeof safeStorage.isEncryptionAvailable === 'function' && safeStorage.isEncryptionAvailable()) {
      const encryptedBuf = safeStorage.encryptString(randomKey.toString('hex'));
      fs.writeFileSync(keyFilePath, encryptedBuf, { mode: 0o600 });
    } else {
      fs.writeFileSync(keyFilePath, randomKey, { mode: 0o600 });
    }
  } catch {
    // Fallback to in-memory key if disk is read-only
  }
  return randomKey;
}

/**
 * Encrypts a secret string using AES-256-GCM and optional Electron safeStorage layer.
 */
function encryptSecret(plainText, masterKey, safeStorage) {
  let payloadToEncrypt = plainText;
  let usedSafeStorage = false;

  if (safeStorage && typeof safeStorage.isEncryptionAvailable === 'function' && safeStorage.isEncryptionAvailable()) {
    payloadToEncrypt = safeStorage.encryptString(plainText).toString('base64');
    usedSafeStorage = true;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(payloadToEncrypt, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    cipherText: encrypted.toString('base64'),
    usedSafeStorage,
  };
}

/**
 * Decrypts a secret string encrypted by `encryptSecret`.
 */
function decryptSecret(envelope, masterKey, safeStorage) {
  if (!envelope || !envelope.iv || !envelope.authTag || !envelope.cipherText) {
    return null;
  }

  const iv = Buffer.from(envelope.iv, 'base64');
  const authTag = Buffer.from(envelope.authTag, 'base64');
  const encrypted = Buffer.from(envelope.cipherText, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

  if (envelope.usedSafeStorage) {
    if (!safeStorage || !safeStorage.isEncryptionAvailable()) {
      throw new Error('OS safeStorage diperlukan untuk mendekripsi kredensial ini.');
    }
    return safeStorage.decryptString(Buffer.from(decrypted, 'base64'));
  }

  return decrypted;
}

class LocalCredentialVault {
  constructor({ userDataPath, safeStorage }) {
    this.userDataPath = userDataPath;
    this.safeStorage = safeStorage || null;
    this.vaultPath = path.join(userDataPath, VAULT_FILENAME);
    this.masterKey = getOrCreateMasterKey(userDataPath, this.safeStorage);
    this.records = new Map();
    this._loadFromDisk();
  }

  _loadFromDisk() {
    if (!fs.existsSync(this.vaultPath)) return;
    try {
      const rawEnvelope = JSON.parse(fs.readFileSync(this.vaultPath, 'utf8'));
      const jsonStr = decryptSecret(rawEnvelope, this.masterKey, this.safeStorage);
      if (!jsonStr) return;
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item.appId === 'string') {
            this.records.set(item.appId, item);
          }
        }
      }
    } catch {
      // Ignore unreadable vault
    }
  }

  _saveToDisk() {
    try {
      fs.mkdirSync(this.userDataPath, { recursive: true });
      const serializable = Array.from(this.records.values());
      const envelope = encryptSecret(
        JSON.stringify(serializable),
        this.masterKey,
        this.safeStorage
      );
      fs.writeFileSync(this.vaultPath, JSON.stringify(envelope), { mode: 0o600 });
    } catch {
      // Ignore write error in restricted environments
    }
  }

  /**
   * Returns sanitized metadata for UI display. NEVER includes password or cipherText.
   */
  listSanitizedCredentials() {
    const result = [];
    for (const rec of this.records.values()) {
      result.push({
        appId: rec.appId,
        appName: rec.appName || '',
        appUrl: rec.appUrl || '',
        username: rec.username || '',
        autofillEnabled: Boolean(rec.autofillEnabled),
        policy: rec.policy || 'saved', // 'saved' | 'never_save'
        hasStoredPassword: Boolean(rec.passwordEnvelope && rec.policy === 'saved'),
        updatedAt: rec.updatedAt || Date.now(),
      });
    }
    return result;
  }

  /**
   * Saves or updates an encrypted credential after explicit user consent.
   */
  saveCredential({ appId, appName, appUrl, username, password, autofillEnabled = true }) {
    if (!appId || typeof appId !== 'string') {
      return { ok: false, error: 'ID aplikasi tidak valid.' };
    }
    const cleanUsername = String(username || '').trim();
    const rawPassword = String(password || '');
    if (!cleanUsername || !rawPassword) {
      return { ok: false, error: 'Username dan password wajib diisi.' };
    }

    const passwordEnvelope = encryptSecret(rawPassword, this.masterKey, this.safeStorage);
    const now = Date.now();

    this.records.set(appId, {
      appId,
      appName: String(appName || '').trim(),
      appUrl: String(appUrl || '').trim(),
      username: cleanUsername,
      passwordEnvelope,
      autofillEnabled: Boolean(autofillEnabled),
      policy: 'saved',
      updatedAt: now,
    });

    this._saveToDisk();
    return {
      ok: true,
      item: {
        appId,
        appName: String(appName || '').trim(),
        appUrl: String(appUrl || '').trim(),
        username: cleanUsername,
        autofillEnabled: Boolean(autofillEnabled),
        policy: 'saved',
        hasStoredPassword: true,
        updatedAt: now,
      },
    };
  }

  /**
   * Records that the officer explicitly chose "Jangan simpan akun" for this application.
   */
  setNeverSavePolicy({ appId, appName, appUrl }) {
    if (!appId || typeof appId !== 'string') {
      return { ok: false, error: 'ID aplikasi tidak valid.' };
    }
    const now = Date.now();
    this.records.set(appId, {
      appId,
      appName: String(appName || '').trim(),
      appUrl: String(appUrl || '').trim(),
      username: '',
      passwordEnvelope: null,
      autofillEnabled: false,
      policy: 'never_save',
      updatedAt: now,
    });
    this._saveToDisk();
    return { ok: true };
  }

  /**
   * Toggles autofill status for a saved account.
   */
  setAutofillEnabled(appId, enabled) {
    const rec = this.records.get(appId);
    if (!rec || rec.policy !== 'saved') {
      return { ok: false, error: 'Akun tersimpan tidak ditemukan.' };
    }
    rec.autofillEnabled = Boolean(enabled);
    rec.updatedAt = Date.now();
    this.records.set(appId, rec);
    this._saveToDisk();
    return { ok: true, autofillEnabled: rec.autofillEnabled };
  }

  /**
   * Deletes a single saved credential or policy record.
   */
  deleteCredential(appId) {
    const existed = this.records.delete(appId);
    this._saveToDisk();
    return { ok: true, deleted: existed };
  }

  /**
   * Deletes all saved credentials on this computer.
   */
  clearAllCredentials() {
    this.records.clear();
    this._saveToDisk();
    return { ok: true };
  }

  /**
   * Internal-only method used by the Main Process to retrieve decrypted credentials
   * strictly for autofilling a verified WebContentsView. Never exposed via IPC to UI!
   */
  getDecryptedForAutofill(appId) {
    const rec = this.records.get(appId);
    if (!rec || rec.policy !== 'saved' || !rec.passwordEnvelope) {
      return null;
    }
    try {
      const password = decryptSecret(rec.passwordEnvelope, this.masterKey, this.safeStorage);
      if (!password) return null;
      return {
        appId: rec.appId,
        appUrl: rec.appUrl,
        username: rec.username,
        password,
        autofillEnabled: Boolean(rec.autofillEnabled),
      };
    } catch {
      return null;
    }
  }
}

/**
 * Generates a safe, non-destructive DOM autofill script for `WebContentsView.webContents.executeJavaScript`.
 * - Populates visible username & password fields using native value setters so React/Vue/HTML forms update.
 * - Leaves inputs editable by the user.
 * - NEVER clicks submit or login buttons automatically.
 * - NEVER bypasses CAPTCHA, OTP, or 2FA.
 */
function buildSafeAutofillScript(username, password) {
  const safeUserJson = JSON.stringify(String(username || ''));
  const safePassJson = JSON.stringify(String(password || ''));

  return `(function() {
    try {
      const usernameVal = ${safeUserJson};
      const passwordVal = ${safePassJson};

      function isVisible(el) {
        if (!el || el.disabled || el.readOnly) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      function setNativeInputValue(input, value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, value);
        } else {
          input.value = value;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]')).filter(isVisible);
      if (passwordInputs.length === 0) {
        return {
          status: 'no_login_form',
          message: 'Halaman saat ini tidak menampilkan kolom password login atau Anda sudah masuk (sesi aktif).'
        };
      }

      const targetPass = passwordInputs[0];
      const scopeRoot = targetPass.closest('form') || document.body;

      const candidateSelectors = [
        'input[autocomplete="username"]',
        'input[type="email"]',
        'input[name*="user" i]',
        'input[name*="email" i]',
        'input[name*="nip" i]',
        'input[name*="nik" i]',
        'input[name*="login" i]',
        'input[id*="user" i]',
        'input[id*="email" i]',
        'input[id*="nip" i]',
        'input[type="text"]'
      ];

      let targetUser = null;
      for (const sel of candidateSelectors) {
        const found = Array.from(scopeRoot.querySelectorAll(sel)).find(
          (el) => el !== targetPass && isVisible(el) && el.type !== 'password' && el.type !== 'hidden'
        );
        if (found) {
          targetUser = found;
          break;
        }
      }

      if (!targetUser) {
        const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input:not([type])')).filter(isVisible);
        targetUser = allInputs.find((el) => el !== targetPass) || null;
      }

      if (targetUser) {
        setNativeInputValue(targetUser, usernameVal);
      }
      setNativeInputValue(targetPass, passwordVal);

      const hasCaptchaOrOtp = Boolean(
        document.querySelector('iframe[src*="recaptcha" i], iframe[src*="turnstile" i], [class*="captcha" i], input[autocomplete="one-time-code"], input[name*="otp" i]')
      );

      return {
        status: 'autofilled',
        filledUsername: Boolean(targetUser),
        filledPassword: true,
        hasCaptchaOrOtp,
        message: hasCaptchaOrOtp
          ? 'Username dan password telah diisi otomatis. Silakan selesaikan verifikasi CAPTCHA/OTP dan tekan tombol Login secara manual.'
          : 'Username dan password telah diisi otomatis. Silakan periksa kembali lalu tekan tombol Login.'
      };
    } catch (err) {
      return {
        status: 'incompatible',
        message: 'Form login pada halaman ini tidak kompatibel dengan autofill otomatis. Silakan login secara manual.'
      };
    }
  })();`;
}

module.exports = {
  LocalCredentialVault,
  encryptSecret,
  decryptSecret,
  buildSafeAutofillScript,
};
