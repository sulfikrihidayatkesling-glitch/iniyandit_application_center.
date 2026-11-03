/**
 * External Application Launcher for Standalone PWA & Browser Modes
 * Ensures every external application stored in the database opens in a standard
 * external browser tab/window (e.g. Google Chrome) rather than inside the standalone PWA window.
 */

export interface ExternalLaunchInspectResult {
  canLaunch: boolean;
  targetUrl: string;
  isExternalOrigin: boolean;
  protocol: string | null;
  reason?: string;
}

/**
 * Inspects the URL stored in the database without modifying the original valid URL string.
 * Blocks unsafe pseudo-protocols (e.g. javascript:, data:, vbscript:) while preserving
 * the exact database URL for http:// and https:// targets.
 */
export function inspectExternalAppUrl(
  databaseUrl: string,
  currentOrigin = 'https://iniyandit-portal.local'
): ExternalLaunchInspectResult {
  if (typeof databaseUrl !== 'string' || databaseUrl.trim().length === 0) {
    return {
      canLaunch: false,
      targetUrl: '',
      isExternalOrigin: false,
      protocol: null,
      reason: 'URL aplikasi kosong.',
    };
  }

  // Preserve the exact URL stored in the database (do not mutate path, query, or hash)
  const rawUrl = databaseUrl.trim();

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        canLaunch: false,
        targetUrl: rawUrl,
        isExternalOrigin: false,
        protocol: parsed.protocol,
        reason: 'Hanya protokol http:// dan https:// yang diizinkan.',
      };
    }

    const isExternalOrigin = parsed.origin !== currentOrigin;

    return {
      canLaunch: true,
      targetUrl: rawUrl,
      isExternalOrigin,
      protocol: parsed.protocol,
    };
  } catch {
    return {
      canLaunch: false,
      targetUrl: rawUrl,
      isExternalOrigin: false,
      protocol: null,
      reason: 'Format URL aplikasi tidak valid.',
    };
  }
}

/**
 * Detects whether Iniyandit Application Center is currently running as an installed
 * standalone Desktop/Mobile PWA window.
 */
export function isStandalonePwaWindow(): boolean {
  if (typeof window === 'undefined') return false;
  const matchStandalone =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches);

  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return Boolean(matchStandalone || iosStandalone);
}

/**
 * Standard HTML anchor attributes for opening an external application outside the
 * standalone PWA window in a normal browser tab/window.
 */
export const EXTERNAL_ANCHOR_PROPS = {
  target: '_blank',
  rel: 'noopener noreferrer external',
} as const;

/**
 * Handles direct user click on an external application link or "Buka Aplikasi" button.
 *
 * How it works across environments:
 * 1. Native `<a href={app.url} target="_blank" rel="noopener noreferrer external">` is the primary
 *    standards-compliant mechanism in Chromium Desktop PWAs: clicking an out-of-scope link with
 *    `target="_blank"` instructs the standalone PWA shell to open the URL in a normal browser tab/window
 *    (Google Chrome when installed via Chrome / set as system default) while keeping the standalone
 *    portal window open.
 * 2. When invoked programmatically or when enhanced standalone detachment is needed, synchronous
 *    `window.open(targetUrl, '_blank', 'noopener,noreferrer')` is evaluated directly within the
 *    user gesture handler.
 */
export function handleExternalAppClick(
  e: { preventDefault: () => void; currentTarget?: HTMLElement | null },
  databaseUrl: string
): boolean {
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
  const inspection = inspectExternalAppUrl(databaseUrl, origin);

  if (!inspection.canLaunch) {
    e.preventDefault();
    return false;
  }

  // If the click is on a native <a target="_blank" rel="noopener noreferrer external"> element,
  // allowing the native anchor navigation on a direct user click is the most reliable way in
  // Chrome Desktop PWA to open a regular Chrome browser tab without popup-blocker interference
  // and without trapping navigation inside the standalone window.
  const tagName = e.currentTarget?.tagName?.toUpperCase();
  if (tagName === 'A') {
    return true;
  }

  // For non-anchor elements (e.g. button triggers), invoke window.open synchronously from user gesture
  e.preventDefault();
  if (typeof window !== 'undefined') {
    const opened = window.open(inspection.targetUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      // Fallback temporary anchor click if window.open is restricted
      const anchor = document.createElement('a');
      anchor.href = inspection.targetUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer external';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  }
  return true;
}
