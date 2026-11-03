/**
 * Electron Security Module — Iniyandit Application Center
 * Enforces URL validation, protocol whitelisting (HTTP/HTTPS only),
 * permission sandboxing, and secure WebPreferences for BrowserWindow & WebContentsView.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

function validateSafeUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    return { valid: false, url: '', reason: 'URL kosong.' };
  }
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return {
        valid: false,
        url: trimmed,
        reason: `Protokol ${parsed.protocol} diblokir demi keamanan desktop.`,
      };
    }
    if (!parsed.hostname) {
      return {
        valid: false,
        url: trimmed,
        reason: 'Hostname URL tidak valid.',
      };
    }
    return {
      valid: true,
      url: parsed.toString(),
      protocol: parsed.protocol,
      hostname: parsed.hostname,
    };
  } catch {
    return { valid: false, url: trimmed, reason: 'Format URL tidak valid.' };
  }
}

function createExternalViewWebPreferences() {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    nodeIntegrationInSubFrames: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    enableBlinkFeatures: '',
    partition: 'persist:iniyandit-workspace',
  };
}

module.exports = {
  ALLOWED_PROTOCOLS,
  validateSafeUrl,
  createExternalViewWebPreferences,
};
