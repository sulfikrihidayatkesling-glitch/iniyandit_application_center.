import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../firebase/config';
import {
  ActivityEntityType,
  AdminUserFormInput,
  AdminUserItem,
  ApplicationFormInput,
  ApplicationItem,
  CategoryFormInput,
  CategoryItem,
  DEFAULT_CATEGORIES_SEED,
  OperationType,
  PortalSettings,
} from '../types';
import {
  normalizeUrl,
  slugifyId,
  validateAdminUserInput,
  validateApplicationInput,
  validateCategoryInput,
  validatePortalSettingsInput,
} from '../utils/validation';

export async function logAdminActivity(params: {
  action: string;
  entityType: ActivityEntityType;
  entityName: string;
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const path = `activity_logs/${logId}`;
  try {
    await setDoc(doc(db, 'activity_logs', logId), {
      id: logId,
      action: params.action.slice(0, 200),
      entityType: params.entityType,
      entityName: (params.entityName || '').slice(0, 120),
      actorUid: currentUser.uid,
      actorName: (currentUser.displayName || currentUser.email || 'Administrator').slice(0, 120),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Non-blocking audit log error
    console.warn('Could not write activity log:', path, error);
  }
}

// ============================================================================
// Applications CRUD
// ============================================================================

export async function createApplication(input: ApplicationFormInput): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Anda harus login sebagai Administrator untuk menambahkan aplikasi.');
  }

  const normalizedInput: ApplicationFormInput = {
    ...input,
    name: input.name.trim(),
    url: normalizeUrl(input.url),
    description: input.description.trim(),
    displayOrder: Number(input.displayOrder) || 0,
  };

  const validation = validateApplicationInput(normalizedInput);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const appId = `${slugifyId(normalizedInput.name)}-${Date.now().toString(36)}`;
  const path = `applications/${appId}`;

  try {
    await setDoc(doc(db, 'applications', appId), {
      id: appId,
      name: normalizedInput.name,
      url: normalizedInput.url,
      logoUrl: normalizedInput.logoUrl || '',
      categoryId: normalizedInput.categoryId,
      description: normalizedInput.description,
      isActive: Boolean(normalizedInput.isActive),
      displayOrder: normalizedInput.displayOrder,
      openCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser.uid,
    });

    await logAdminActivity({
      action: `Menambahkan aplikasi "${normalizedInput.name}"`,
      entityType: 'application',
      entityName: normalizedInput.name,
    });

    return appId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateApplication(
  existingApp: ApplicationItem,
  input: ApplicationFormInput
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Anda harus login sebagai Administrator untuk mengubah aplikasi.');
  }

  const normalizedInput: ApplicationFormInput = {
    ...input,
    name: input.name.trim(),
    url: normalizeUrl(input.url),
    description: input.description.trim(),
    displayOrder: Number(input.displayOrder) || 0,
  };

  const validation = validateApplicationInput(normalizedInput);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const path = `applications/${existingApp.id}`;
  try {
    await updateDoc(doc(db, 'applications', existingApp.id), {
      name: normalizedInput.name,
      url: normalizedInput.url,
      logoUrl: normalizedInput.logoUrl || '',
      categoryId: normalizedInput.categoryId,
      description: normalizedInput.description,
      isActive: Boolean(normalizedInput.isActive),
      displayOrder: normalizedInput.displayOrder,
      updatedAt: serverTimestamp(),
    });

    await logAdminActivity({
      action: `Memperbarui aplikasi "${normalizedInput.name}"`,
      entityType: 'application',
      entityName: normalizedInput.name,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleApplicationActiveStatus(
  app: ApplicationItem,
  nextActive: boolean
): Promise<void> {
  const path = `applications/${app.id}`;
  try {
    await updateDoc(doc(db, 'applications', app.id), {
      isActive: Boolean(nextActive),
      updatedAt: serverTimestamp(),
    });

    await logAdminActivity({
      action: `${nextActive ? 'Mengaktifkan' : 'Menonaktifkan'} aplikasi "${app.name}"`,
      entityType: 'application',
      entityName: app.name,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteApplication(app: ApplicationItem): Promise<void> {
  const path = `applications/${app.id}`;
  try {
    await deleteDoc(doc(db, 'applications', app.id));
    await logAdminActivity({
      action: `Menghapus aplikasi "${app.name}"`,
      entityType: 'application',
      entityName: app.name,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// Categories CRUD
// ============================================================================

export async function createCategory(input: CategoryFormInput): Promise<string> {
  const normalizedInput: CategoryFormInput = {
    ...input,
    name: input.name.trim(),
    description: input.description.trim(),
    icon: input.icon.trim() || 'folder',
    displayOrder: Number(input.displayOrder) || 0,
  };

  const validation = validateCategoryInput(normalizedInput);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const categoryId =
    normalizedInput.id && normalizedInput.id.trim()
      ? slugifyId(normalizedInput.id)
      : `${slugifyId(normalizedInput.name)}-${Date.now().toString(36).slice(-4)}`;

  const path = `categories/${categoryId}`;
  try {
    await setDoc(doc(db, 'categories', categoryId), {
      id: categoryId,
      name: normalizedInput.name,
      description: normalizedInput.description,
      icon: normalizedInput.icon,
      displayOrder: normalizedInput.displayOrder,
      isActive: Boolean(normalizedInput.isActive),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await logAdminActivity({
      action: `Menambahkan kategori "${normalizedInput.name}"`,
      entityType: 'category',
      entityName: normalizedInput.name,
    });

    return categoryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCategory(
  existingCategory: CategoryItem,
  input: CategoryFormInput
): Promise<void> {
  const normalizedInput: CategoryFormInput = {
    ...input,
    name: input.name.trim(),
    description: input.description.trim(),
    icon: input.icon.trim() || 'folder',
    displayOrder: Number(input.displayOrder) || 0,
  };

  const validation = validateCategoryInput(normalizedInput);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const path = `categories/${existingCategory.id}`;
  try {
    await updateDoc(doc(db, 'categories', existingCategory.id), {
      name: normalizedInput.name,
      description: normalizedInput.description,
      icon: normalizedInput.icon,
      displayOrder: normalizedInput.displayOrder,
      isActive: Boolean(normalizedInput.isActive),
      updatedAt: serverTimestamp(),
    });

    await logAdminActivity({
      action: `Memperbarui kategori "${normalizedInput.name}"`,
      entityType: 'category',
      entityName: normalizedInput.name,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleCategoryActiveStatus(
  category: CategoryItem,
  nextActive: boolean
): Promise<void> {
  const path = `categories/${category.id}`;
  try {
    await updateDoc(doc(db, 'categories', category.id), {
      isActive: Boolean(nextActive),
      updatedAt: serverTimestamp(),
    });

    await logAdminActivity({
      action: `${nextActive ? 'Mengaktifkan' : 'Menonaktifkan'} kategori "${category.name}"`,
      entityType: 'category',
      entityName: category.name,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCategory(category: CategoryItem): Promise<void> {
  const path = `categories/${category.id}`;
  try {
    await deleteDoc(doc(db, 'categories', category.id));
    await logAdminActivity({
      action: `Menghapus kategori "${category.name}"`,
      entityType: 'category',
      entityName: category.name,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function initializeStandardCategories(
  existingCategoryIds: string[]
): Promise<number> {
  const existingSet = new Set(existingCategoryIds);
  const toCreate = DEFAULT_CATEGORIES_SEED.filter((cat) => !existingSet.has(cat.id));
  if (toCreate.length === 0) return 0;

  const path = 'categories';
  try {
    const batch = writeBatch(db);
    for (const cat of toCreate) {
      const ref = doc(collection(db, 'categories'), cat.id);
      batch.set(ref, {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();

    await logAdminActivity({
      action: `Menginisialisasi ${toCreate.length} kategori standar Puskesmas`,
      entityType: 'category',
      entityName: 'Kategori Standar',
    });

    return toCreate.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// Admin Users CRUD
// ============================================================================

export async function createAdminUser(input: AdminUserFormInput): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Sesi admin tidak ditemukan.');
  }

  const normalizedInput: AdminUserFormInput = {
    uid: input.uid.trim(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    isActive: Boolean(input.isActive),
  };

  const validation = validateAdminUserInput(normalizedInput);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const path = `admins/${normalizedInput.uid}`;
  try {
    await setDoc(doc(db, 'admins', normalizedInput.uid), {
      uid: normalizedInput.uid,
      name: normalizedInput.name,
      email: normalizedInput.email,
      role: normalizedInput.role,
      isActive: normalizedInput.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser.uid,
    });

    await logAdminActivity({
      action: `Menambahkan administrator "${normalizedInput.name}" (${normalizedInput.email})`,
      entityType: 'admin',
      entityName: normalizedInput.name,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAdminUser(
  existingAdmin: AdminUserItem,
  updates: Pick<AdminUserFormInput, 'name' | 'email' | 'role' | 'isActive'>
): Promise<void> {
  const normalized: AdminUserFormInput = {
    uid: existingAdmin.uid,
    name: updates.name.trim(),
    email: updates.email.trim().toLowerCase(),
    role: updates.role,
    isActive: Boolean(updates.isActive),
  };

  const validation = validateAdminUserInput(normalized);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const path = `admins/${existingAdmin.uid}`;
  try {
    await updateDoc(doc(db, 'admins', existingAdmin.uid), {
      name: normalized.name,
      email: normalized.email,
      role: normalized.role,
      isActive: normalized.isActive,
      updatedAt: serverTimestamp(),
    });

    await logAdminActivity({
      action: `Memperbarui data administrator "${normalized.name}"`,
      entityType: 'admin',
      entityName: normalized.name,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAdminUser(admin: AdminUserItem): Promise<void> {
  const path = `admins/${admin.uid}`;
  try {
    await deleteDoc(doc(db, 'admins', admin.uid));
    await logAdminActivity({
      action: `Menghapus akses administrator "${admin.name}"`,
      entityType: 'admin',
      entityName: admin.name,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// Portal Settings
// ============================================================================

export async function savePortalSettings(
  settings: PortalSettings,
  isNewDocument: boolean
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Anda harus login sebagai Administrator.');
  }

  const normalized: PortalSettings = {
    portalName: settings.portalName.trim(),
    institutionName: settings.institutionName.trim(),
    tagline: settings.tagline.trim(),
    portalDescription: settings.portalDescription.trim(),
    logoUrl: settings.logoUrl || '',
    officialLogoUrl: settings.officialLogoUrl || '',
    primaryColor: settings.primaryColor.trim() || '#0F766E',
    isPublic: true,
  };

  const validation = validatePortalSettingsInput(normalized);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const path = 'settings/portal';
  try {
    if (isNewDocument) {
      await setDoc(doc(db, 'settings', 'portal'), {
        ...normalized,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      });
    } else {
      await updateDoc(doc(db, 'settings', 'portal'), {
        ...normalized,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      });
    }

    await logAdminActivity({
      action: 'Memperbarui pengaturan identitas portal',
      entityType: 'settings',
      entityName: normalized.portalName,
    });
  } catch (error) {
    handleFirestoreError(
      error,
      isNewDocument ? OperationType.CREATE : OperationType.UPDATE,
      path
    );
  }
}
