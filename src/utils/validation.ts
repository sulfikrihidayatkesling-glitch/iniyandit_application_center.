import {
  ApplicationFormInput,
  ApplicationItem,
  CategoryFormInput,
  CategoryItem,
  AdminUserFormInput,
  PortalSettings,
} from '../types';

export const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
export const URL_REGEX = /^https?:\/\/.+/;
export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$/;
export const BOOTSTRAPPED_ADMIN_EMAIL = 'sulfikrihidayatkesling@gmail.com';

export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && ID_REGEX.test(id);
}

export function slugifyId(input: string): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_\-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return cleaned || `item-${Date.now()}`;
}

export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateApplicationInput(input: ApplicationFormInput): ValidationResult {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 120) {
    return { valid: false, error: 'Nama aplikasi wajib diisi (maksimal 120 karakter).' };
  }

  const url = normalizeUrl(input.url);
  if (url.length < 8 || url.length > 1000 || !URL_REGEX.test(url)) {
    return { valid: false, error: 'URL aplikasi tidak valid. Gunakan format https://contoh.go.id' };
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { valid: false, error: 'URL aplikasi harus menyertakan domain yang valid (misal: kemkes.go.id).' };
    }
  } catch {
    return { valid: false, error: 'Format URL aplikasi tidak valid.' };
  }

  if (!isValidId(input.categoryId)) {
    return { valid: false, error: 'Silakan pilih kategori aplikasi yang valid.' };
  }

  if (input.description.trim().length > 600) {
    return { valid: false, error: 'Deskripsi aplikasi maksimal 600 karakter.' };
  }

  if (input.logoUrl && input.logoUrl.length > 500000) {
    return { valid: false, error: 'Ukuran data logo terlalu besar (maksimal 500KB).' };
  }

  const order = Number(input.displayOrder);
  if (!Number.isInteger(order) || order < 0 || order > 10000) {
    return { valid: false, error: 'Urutan tampilan harus berupa angka bulat antara 0 hingga 10000.' };
  }

  return { valid: true };
}

export function validateCategoryInput(input: CategoryFormInput): ValidationResult {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 100) {
    return { valid: false, error: 'Nama kategori wajib diisi (maksimal 100 karakter).' };
  }

  if (input.description.trim().length > 500) {
    return { valid: false, error: 'Deskripsi kategori maksimal 500 karakter.' };
  }

  if (!input.icon || input.icon.trim().length < 1 || input.icon.trim().length > 60) {
    return { valid: false, error: 'Ikon kategori wajib dipilih.' };
  }

  const order = Number(input.displayOrder);
  if (!Number.isInteger(order) || order < 0 || order > 10000) {
    return { valid: false, error: 'Urutan tampilan harus berupa angka bulat antara 0 hingga 10000.' };
  }

  return { valid: true };
}

export function validateAdminUserInput(input: AdminUserFormInput): ValidationResult {
  if (!isValidId(input.uid.trim())) {
    return {
      valid: false,
      error: 'UID Admin wajib diisi (hanya huruf, angka, tanda hubung, atau garis bawah, maks 128 karakter).',
    };
  }

  const name = input.name.trim();
  if (name.length < 1 || name.length > 120) {
    return { valid: false, error: 'Nama lengkap admin wajib diisi (maksimal 120 karakter).' };
  }

  const email = input.email.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Alamat email admin tidak valid.' };
  }

  if (input.role !== 'super_admin' && input.role !== 'admin') {
    return { valid: false, error: 'Kewenangan (role) admin harus super_admin atau admin.' };
  }

  return { valid: true };
}

export function validatePortalSettingsInput(input: PortalSettings): ValidationResult {
  if (input.portalName.trim().length < 1 || input.portalName.trim().length > 120) {
    return { valid: false, error: 'Nama portal wajib diisi (maksimal 120 karakter).' };
  }
  if (input.institutionName.trim().length < 1 || input.institutionName.trim().length > 120) {
    return { valid: false, error: 'Nama institusi wajib diisi (maksimal 120 karakter).' };
  }
  if (input.tagline.trim().length < 1 || input.tagline.trim().length > 200) {
    return { valid: false, error: 'Tagline wajib diisi (maksimal 200 karakter).' };
  }
  if (input.portalDescription.trim().length < 1 || input.portalDescription.trim().length > 600) {
    return { valid: false, error: 'Deskripsi portal wajib diisi (maksimal 600 karakter).' };
  }
  if (!HEX_COLOR_REGEX.test(input.primaryColor.trim())) {
    return { valid: false, error: 'Warna utama harus berupa kode warna HEX yang valid (contoh: #0F766E).' };
  }
  return { valid: true };
}

/**
 * Pure filtering and sorting logic for the Public Officer Portal and Admin views.
 */
export function filterAndSortApplications(params: {
  applications: ApplicationItem[];
  categories: CategoryItem[];
  searchQuery: string;
  selectedCategoryId: string; // 'all' | 'favorites' | categoryId
  favoriteIds: string[];
  onlyActive?: boolean;
}): ApplicationItem[] {
  const {
    applications,
    categories,
    searchQuery,
    selectedCategoryId,
    favoriteIds,
    onlyActive = true,
  } = params;

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name.toLowerCase());
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  return applications
    .filter((app) => {
      if (onlyActive && !app.isActive) return false;

      if (selectedCategoryId === 'favorites') {
        if (!favoriteIds.includes(app.id)) return false;
      } else if (selectedCategoryId !== 'all') {
        if (app.categoryId !== selectedCategoryId) return false;
      }

      if (!normalizedQuery) return true;

      const nameMatch = app.name.toLowerCase().includes(normalizedQuery);
      const descMatch = (app.description || '').toLowerCase().includes(normalizedQuery);
      const catName = categoryMap.get(app.categoryId) || app.categoryId.toLowerCase();
      const catMatch = catName.includes(normalizedQuery);

      return nameMatch || descMatch || catMatch;
    })
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.name.localeCompare(b.name, 'id');
    });
}

export function toggleFavoriteId(currentFavorites: string[], appId: string): string[] {
  if (currentFavorites.includes(appId)) {
    return currentFavorites.filter((id) => id !== appId);
  }
  return [...currentFavorites, appId];
}

/**
 * Deterministic simulator of the Firestore Security Rules for unit-testing the "Dirty Dozen" payloads.
 */
export interface SimulatedAuthContext {
  uid: string;
  email: string;
  email_verified: boolean;
}

export interface SimulatedRuleEnv {
  auth: SimulatedAuthContext | null;
  requestTime: number;
  existingCategories: Set<string>;
  existingAdmins: Map<string, { isActive: boolean; email: string }>;
  existingDoc?: Record<string, unknown> | null;
}

export function evaluateFirestoreRule(
  collection: 'applications' | 'categories' | 'admins' | 'settings' | 'activity_logs',
  operation: 'get' | 'list' | 'create' | 'update' | 'delete',
  docId: string,
  incomingData: Record<string, unknown> | null,
  env: SimulatedRuleEnv
): 'ALLOW' | 'PERMISSION_DENIED' {
  const isSignedIn = env.auth !== null;
  const isVerifiedUser = isSignedIn && env.auth?.email_verified === true;
  const isBootstrappedAdmin =
    isVerifiedUser && env.auth?.email === BOOTSTRAPPED_ADMIN_EMAIL;
  const isRegisteredAdmin =
    isVerifiedUser &&
    env.auth !== null &&
    env.existingAdmins.get(env.auth.uid)?.isActive === true;
  const isAdmin = isBootstrappedAdmin || isRegisteredAdmin;
  const isOwner = (uid: string) => isVerifiedUser && env.auth?.uid === uid;

  if (operation !== 'list' && !isValidId(docId)) {
    return 'PERMISSION_DENIED';
  }

  if (collection === 'applications') {
    if (operation === 'get' || operation === 'list') {
      const isActive = env.existingDoc?.isActive === true;
      return isActive || isAdmin ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (operation === 'delete') {
      return isSignedIn && isAdmin ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (!isSignedIn || !incomingData) return 'PERMISSION_DENIED';

    const allowedKeys = [
      'id', 'name', 'url', 'logoUrl', 'categoryId', 'description',
      'isActive', 'displayOrder', 'openCount', 'createdAt', 'updatedAt', 'createdBy'
    ];
    const keys = Object.keys(incomingData);
    if (
      keys.length !== allowedKeys.length ||
      !allowedKeys.every((k) => keys.includes(k))
    ) {
      return 'PERMISSION_DENIED';
    }

    if (
      !isValidId(incomingData.id) ||
      typeof incomingData.name !== 'string' ||
      incomingData.name.length < 1 ||
      incomingData.name.length > 120 ||
      typeof incomingData.url !== 'string' ||
      incomingData.url.length < 8 ||
      incomingData.url.length > 1000 ||
      !URL_REGEX.test(incomingData.url) ||
      typeof incomingData.logoUrl !== 'string' ||
      incomingData.logoUrl.length > 500000 ||
      !isValidId(incomingData.categoryId) ||
      typeof incomingData.description !== 'string' ||
      incomingData.description.length > 600 ||
      typeof incomingData.isActive !== 'boolean' ||
      typeof incomingData.displayOrder !== 'number' ||
      !Number.isInteger(incomingData.displayOrder) ||
      incomingData.displayOrder < 0 ||
      incomingData.displayOrder > 10000 ||
      typeof incomingData.openCount !== 'number' ||
      !Number.isInteger(incomingData.openCount) ||
      incomingData.openCount < 0 ||
      typeof incomingData.createdAt !== 'number' ||
      typeof incomingData.updatedAt !== 'number' ||
      typeof incomingData.createdBy !== 'string' ||
      incomingData.createdBy.length < 1 ||
      incomingData.createdBy.length > 128
    ) {
      return 'PERMISSION_DENIED';
    }

    if (!isAdmin || !env.existingCategories.has(incomingData.categoryId)) {
      return 'PERMISSION_DENIED';
    }

    if (operation === 'create') {
      if (
        incomingData.id !== docId ||
        incomingData.createdBy !== env.auth?.uid ||
        incomingData.createdAt !== env.requestTime ||
        incomingData.updatedAt !== env.requestTime
      ) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOW';
    }

    if (operation === 'update') {
      if (!env.existingDoc) return 'PERMISSION_DENIED';
      if (
        incomingData.id !== env.existingDoc.id ||
        incomingData.createdBy !== env.existingDoc.createdBy ||
        incomingData.createdAt !== env.existingDoc.createdAt ||
        incomingData.updatedAt !== env.requestTime
      ) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOW';
    }
  }

  if (collection === 'admins') {
    if (operation === 'get') {
      return isSignedIn && (isOwner(docId) || isAdmin) ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (operation === 'list') {
      return isSignedIn && typeof env.existingDoc?.email === 'string' && isAdmin
        ? 'ALLOW'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'create') {
      if (!isSignedIn || !isAdmin || !incomingData) return 'PERMISSION_DENIED';
      if (incomingData.uid !== docId || incomingData.createdBy !== env.auth?.uid) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOW';
    }
  }

  if (collection === 'activity_logs') {
    if (operation === 'update' || operation === 'delete') {
      return 'PERMISSION_DENIED';
    }
    if (operation === 'get' || operation === 'list') {
      return isSignedIn && isAdmin ? 'ALLOW' : 'PERMISSION_DENIED';
    }
  }

  return 'PERMISSION_DENIED';
}
