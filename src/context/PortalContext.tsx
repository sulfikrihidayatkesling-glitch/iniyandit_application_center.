import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import {
  ActivityLogItem,
  AdminRole,
  AdminUserItem,
  ApplicationItem,
  CategoryItem,
  DEFAULT_CATEGORIES_SEED,
  DEFAULT_PORTAL_SETTINGS,
  PortalSettings,
} from '../types';
import { BOOTSTRAPPED_ADMIN_EMAIL, toggleFavoriteId } from '../utils/validation';
import { logAdminActivity } from '../services/portalService';

const FAVORITES_STORAGE_KEY = 'iniyandit_favorite_apps_v1';

interface PortalContextValue {
  // Auth & Admin state
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminRole: AdminRole | null;
  adminChecking: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;

  // Public data
  publicApplications: ApplicationItem[];
  publicCategories: CategoryItem[];
  settings: PortalSettings;
  hasCustomSettingsDoc: boolean;
  loadingPublic: boolean;
  publicError: string | null;

  // Favorites (localStorage)
  favoriteIds: string[];
  toggleFavorite: (appId: string) => boolean;

  // Admin data (all items including inactive)
  allApplications: ApplicationItem[];
  allCategories: CategoryItem[];
  adminsList: AdminUserItem[];
  activityLogs: ActivityLogItem[];
  loadingAdmin: boolean;
}

const PortalContext = createContext<PortalContextValue | undefined>(undefined);

function parseTimestampMillis(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminChecking, setAdminChecking] = useState(true);

  const [publicApplications, setPublicApplications] = useState<ApplicationItem[]>([]);
  const [firestoreActiveCategories, setFirestoreActiveCategories] = useState<CategoryItem[]>([]);
  const [settings, setSettings] = useState<PortalSettings>(DEFAULT_PORTAL_SETTINGS);
  const [hasCustomSettingsDoc, setHasCustomSettingsDoc] = useState(false);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [publicError, setPublicError] = useState<string | null>(null);

  const [allApplications, setAllApplications] = useState<ApplicationItem[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [adminsList, setAdminsList] = useState<AdminUserItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((appId: string): boolean => {
    let added = false;
    setFavoriteIds((prev) => {
      added = !prev.includes(appId);
      const next = toggleFavoriteId(prev, appId);
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
    return added;
  }, []);

  // 1. Auth & Admin Verification Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsAdmin(false);
        setAdminRole(null);
        setAdminChecking(false);
        setAuthReady(true);
        return;
      }

      setAdminChecking(true);
      try {
        const isBootstrapped =
          currentUser.emailVerified &&
          currentUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

        if (isBootstrapped) {
          // Ensure bootstrapped admin record is synced in /admins/{uid} before attaching listeners
          try {
            const adminRef = doc(db, 'admins', currentUser.uid);
            const snap = await getDoc(adminRef);
            if (!snap.exists()) {
              await setDoc(adminRef, {
                uid: currentUser.uid,
                name: currentUser.displayName || 'Super Administrator Puskesmas',
                email: currentUser.email || BOOTSTRAPPED_ADMIN_EMAIL,
                role: 'super_admin',
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: currentUser.uid,
              });
            }
          } catch {
            // Non-blocking sync
          }
          setIsAdmin(true);
          setAdminRole('super_admin');
        } else if (currentUser.emailVerified) {
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
          if (adminDoc.exists() && adminDoc.data()?.isActive === true) {
            setIsAdmin(true);
            setAdminRole((adminDoc.data()?.role as AdminRole) || 'admin');
          } else {
            setIsAdmin(false);
            setAdminRole(null);
          }
        } else {
          setIsAdmin(false);
          setAdminRole(null);
        }
      } catch (err) {
        console.error('Error verifying admin privileges:', err);
        setIsAdmin(false);
        setAdminRole(null);
      } finally {
        setAdminChecking(false);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Public Real-Time Listeners (Active Applications, Active Categories, Public Settings)
  useEffect(() => {
    setLoadingPublic(true);
    let appsLoaded = false;
    let catsLoaded = false;

    const checkDone = () => {
      if (appsLoaded && catsLoaded) {
        setLoadingPublic(false);
      }
    };

    const qApps = query(collection(db, 'applications'), where('isActive', '==', true));
    const unsubApps = onSnapshot(
      qApps,
      (snapshot) => {
        const items: ApplicationItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name || ''),
            url: String(data.url || ''),
            logoUrl: String(data.logoUrl || ''),
            categoryId: String(data.categoryId || ''),
            description: String(data.description || ''),
            isActive: Boolean(data.isActive),
            displayOrder: Number(data.displayOrder) || 0,
            openCount: Number(data.openCount) || 0,
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
            createdBy: String(data.createdBy || ''),
          };
        });
        items.sort((a, b) =>
          a.displayOrder !== b.displayOrder
            ? a.displayOrder - b.displayOrder
            : a.name.localeCompare(b.name, 'id')
        );
        setPublicApplications(items);
        setPublicError(null);
        appsLoaded = true;
        checkDone();
      },
      (err) => {
        console.error('Public applications listener error:', err);
        setPublicError('Gagal memuat daftar aplikasi dari server.');
        appsLoaded = true;
        checkDone();
      }
    );

    const qCats = query(collection(db, 'categories'), where('isActive', '==', true));
    const unsubCats = onSnapshot(
      qCats,
      (snapshot) => {
        const items: CategoryItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name || ''),
            description: String(data.description || ''),
            icon: String(data.icon || 'folder'),
            displayOrder: Number(data.displayOrder) || 0,
            isActive: Boolean(data.isActive),
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          };
        });
        items.sort((a, b) =>
          a.displayOrder !== b.displayOrder
            ? a.displayOrder - b.displayOrder
            : a.name.localeCompare(b.name, 'id')
        );
        setFirestoreActiveCategories(items);
        catsLoaded = true;
        checkDone();
      },
      (err) => {
        console.error('Public categories listener error:', err);
        catsLoaded = true;
        checkDone();
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'portal'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setHasCustomSettingsDoc(true);
          setSettings({
            portalName: String(data.portalName || DEFAULT_PORTAL_SETTINGS.portalName),
            institutionName: String(data.institutionName || DEFAULT_PORTAL_SETTINGS.institutionName),
            tagline: String(data.tagline || DEFAULT_PORTAL_SETTINGS.tagline),
            portalDescription: String(
              data.portalDescription || DEFAULT_PORTAL_SETTINGS.portalDescription
            ),
            logoUrl: String(data.logoUrl || ''),
            officialLogoUrl: String(data.officialLogoUrl || ''),
            primaryColor: String(data.primaryColor || '#0F766E'),
            isPublic: true,
            updatedAt: data.updatedAt || null,
            updatedBy: String(data.updatedBy || ''),
          });
        } else {
          setHasCustomSettingsDoc(false);
          setSettings(DEFAULT_PORTAL_SETTINGS);
        }
      },
      () => {
        // Ignore if settings/portal doesn't exist yet (public get on non-existent doc is denied by existing().isPublic)
        setHasCustomSettingsDoc(false);
        setSettings(DEFAULT_PORTAL_SETTINGS);
      }
    );

    return () => {
      unsubApps();
      unsubCats();
      unsubSettings();
    };
  }, []);

  // 3. Admin Real-Time Listeners (only attached when authenticated as verified Admin)
  useEffect(() => {
    if (!authReady || adminChecking || !user || !isAdmin) {
      setAllApplications([]);
      setAllCategories([]);
      setAdminsList([]);
      setActivityLogs([]);
      return;
    }

    setLoadingAdmin(true);

    const unsubAllApps = onSnapshot(
      collection(db, 'applications'),
      (snapshot) => {
        const items: ApplicationItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name || ''),
            url: String(data.url || ''),
            logoUrl: String(data.logoUrl || ''),
            categoryId: String(data.categoryId || ''),
            description: String(data.description || ''),
            isActive: Boolean(data.isActive),
            displayOrder: Number(data.displayOrder) || 0,
            openCount: Number(data.openCount) || 0,
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
            createdBy: String(data.createdBy || ''),
          };
        });
        items.sort((a, b) =>
          a.displayOrder !== b.displayOrder
            ? a.displayOrder - b.displayOrder
            : a.name.localeCompare(b.name, 'id')
        );
        setAllApplications(items);
        setLoadingAdmin(false);
      },
      (err) => {
        console.error('Admin applications listener error:', err);
        setLoadingAdmin(false);
      }
    );

    const unsubAllCats = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const items: CategoryItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name || ''),
            description: String(data.description || ''),
            icon: String(data.icon || 'folder'),
            displayOrder: Number(data.displayOrder) || 0,
            isActive: Boolean(data.isActive),
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          };
        });
        items.sort((a, b) =>
          a.displayOrder !== b.displayOrder
            ? a.displayOrder - b.displayOrder
            : a.name.localeCompare(b.name, 'id')
        );
        setAllCategories(items);
      },
      (err) => {
        console.error('Admin categories listener error:', err);
      }
    );

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snapshot) => {
        const items: AdminUserItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            name: String(data.name || ''),
            email: String(data.email || ''),
            role: (data.role as AdminRole) || 'admin',
            isActive: Boolean(data.isActive),
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
            createdBy: String(data.createdBy || ''),
          };
        });
        setAdminsList(items);
      },
      (err) => {
        console.error('Admins list listener error:', err);
      }
    );

    const unsubLogs = onSnapshot(
      collection(db, 'activity_logs'),
      (snapshot) => {
        const items: ActivityLogItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            action: String(data.action || ''),
            entityType: (data.entityType as ActivityLogItem['entityType']) || 'application',
            entityName: String(data.entityName || ''),
            actorUid: String(data.actorUid || ''),
            actorName: String(data.actorName || ''),
            createdAt: data.createdAt || null,
          };
        });
        items.sort((a, b) => parseTimestampMillis(b.createdAt) - parseTimestampMillis(a.createdAt));
        setActivityLogs(items.slice(0, 30));
      },
      (err) => {
        console.error('Activity logs listener error:', err);
      }
    );

    return () => {
      unsubAllApps();
      unsubAllCats();
      unsubAdmins();
      unsubLogs();
    };
  }, [authReady, adminChecking, user, isAdmin]);

  // If Firestore categories collection is still empty on initial boot, expose the 8 standard categories
  // dynamically on the public filter bar until the admin customizes/initializes categories in Firestore.
  const publicCategories = useMemo<CategoryItem[]>(() => {
    if (firestoreActiveCategories.length > 0) {
      return firestoreActiveCategories;
    }
    return DEFAULT_CATEGORIES_SEED.map((c) => ({
      ...c,
      createdAt: null,
      updatedAt: null,
    }));
  }, [firestoreActiveCategories]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (credential.user) {
      await logAdminActivity({
        action: 'Admin login ke sistem menggunakan Email & Password',
        entityType: 'auth',
        entityName: credential.user.email || 'Admin',
      });
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    if (credential.user) {
      await logAdminActivity({
        action: 'Admin login ke sistem menggunakan akun Google terverifikasi',
        entityType: 'auth',
        entityName: credential.user.email || 'Admin',
      });
    }
  }, []);

  const sendResetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const logoutAdmin = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo<PortalContextValue>(
    () => ({
      user,
      authReady,
      isAdmin,
      adminRole,
      adminChecking,
      loginWithEmail,
      loginWithGoogle,
      sendResetPassword,
      logoutAdmin,
      publicApplications,
      publicCategories,
      settings,
      hasCustomSettingsDoc,
      loadingPublic,
      publicError,
      favoriteIds,
      toggleFavorite,
      allApplications,
      allCategories,
      adminsList,
      activityLogs,
      loadingAdmin,
    }),
    [
      user,
      authReady,
      isAdmin,
      adminRole,
      adminChecking,
      loginWithEmail,
      loginWithGoogle,
      sendResetPassword,
      logoutAdmin,
      publicApplications,
      publicCategories,
      settings,
      hasCustomSettingsDoc,
      loadingPublic,
      publicError,
      favoriteIds,
      toggleFavorite,
      allApplications,
      allCategories,
      adminsList,
      activityLogs,
      loadingAdmin,
    ]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return ctx;
}
