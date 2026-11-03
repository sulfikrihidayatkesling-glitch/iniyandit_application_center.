import { Timestamp } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface ApplicationItem {
  id: string;
  name: string;
  url: string;
  logoUrl: string;
  categoryId: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
  openCount: number;
  createdAt: Timestamp | Date | string | null;
  updatedAt: Timestamp | Date | string | null;
  createdBy: string;
}

export interface ApplicationFormInput {
  name: string;
  url: string;
  logoUrl: string;
  categoryId: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Timestamp | Date | string | null;
  updatedAt: Timestamp | Date | string | null;
}

export interface CategoryFormInput {
  id?: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

export type AdminRole = 'super_admin' | 'admin';

export interface AdminUserItem {
  uid: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Timestamp | Date | string | null;
  updatedAt: Timestamp | Date | string | null;
  createdBy: string;
}

export interface AdminUserFormInput {
  uid: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
}

export interface PortalSettings {
  portalName: string;
  institutionName: string;
  tagline: string;
  portalDescription: string;
  logoUrl: string;
  officialLogoUrl: string;
  primaryColor: string;
  isPublic: boolean;
  updatedAt?: Timestamp | Date | string | null;
  updatedBy?: string;
}

export type ActivityEntityType = 'application' | 'category' | 'admin' | 'settings' | 'auth';

export interface ActivityLogItem {
  id: string;
  action: string;
  entityType: ActivityEntityType;
  entityName: string;
  actorUid: string;
  actorName: string;
  createdAt: Timestamp | Date | string | null;
}

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  portalName: 'Iniyandit Application Center',
  institutionName: 'UPTD Puskesmas Iniyandit',
  tagline: 'One Account. One Portal. All Applications.',
  portalDescription:
    'Pusat akses digital seluruh aplikasi kerja UPTD Puskesmas Iniyandit dalam satu portal yang modern, praktis, dan terintegrasi.',
  logoUrl: '',
  officialLogoUrl: '',
  primaryColor: '#0F766E',
  isPublic: true,
};

export const DEFAULT_CATEGORIES_SEED: Omit<CategoryItem, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'kemenkes',
    name: 'Kementerian Kesehatan',
    description: 'Aplikasi nasional Kementerian Kesehatan RI (SatuSehat, ASIK, SISDMK, e-Kinerja, dll)',
    icon: 'heart-pulse',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'dinkes',
    name: 'Dinas Kesehatan',
    description: 'Sistem informasi dan pelaporan Dinas Kesehatan Kabupaten/Provinsi',
    icon: 'shield-plus',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'pemda',
    name: 'Pemerintah Daerah',
    description: 'Portal layanan kepegawaian, perencanaan, dan administrasi Pemerintah Daerah',
    icon: 'landmark',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'administrasi',
    name: 'Administrasi Puskesmas',
    description: 'Manajemen surat-menyurat, kepegawaian, inventaris, dan tata usaha Puskesmas',
    icon: 'file-text',
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'kesling',
    name: 'Kesehatan Lingkungan',
    description: 'Pemantauan STBM, kualitas air, sanitasi tempat fasilitas umum, dan limbah medis',
    icon: 'sprout',
    displayOrder: 5,
    isActive: true,
  },
  {
    id: 'program-kesehatan',
    name: 'Program Kesehatan',
    description: 'Layanan UKM, gizi, KIA, imunisasi, P2P, dan promosi kesehatan masyarakat',
    icon: 'activity',
    displayOrder: 6,
    isActive: true,
  },
  {
    id: 'pelaporan',
    name: 'Pelaporan',
    description: 'Laporan bulanan SP2TP, profil kesehatan, indikator mutu, dan capaian SPM',
    icon: 'bar-chart-3',
    displayOrder: 7,
    isActive: true,
  },
  {
    id: 'aplikasi-internal',
    name: 'Aplikasi Internal',
    description: 'Inovasi digital dan sistem operasional internal UPTD Puskesmas Iniyandit',
    icon: 'layout-grid',
    displayOrder: 8,
    isActive: true,
  },
];
