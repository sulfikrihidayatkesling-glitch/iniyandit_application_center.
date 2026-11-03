import React from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  FileSpreadsheet,
  FileText,
  Folder,
  Globe,
  HeartPulse,
  Landmark,
  LayoutGrid,
  ShieldPlus,
  Sprout,
  Stethoscope,
  Users,
} from 'lucide-react';

export const CATEGORY_ICON_OPTIONS = [
  { id: 'heart-pulse', label: 'Kesehatan / Kemenkes' },
  { id: 'shield-plus', label: 'Dinas Kesehatan / Medis' },
  { id: 'landmark', label: 'Pemerintah Daerah' },
  { id: 'file-text', label: 'Administrasi & Dokumen' },
  { id: 'sprout', label: 'Kesehatan Lingkungan' },
  { id: 'activity', label: 'Program Kesehatan & UKM' },
  { id: 'bar-chart-3', label: 'Pelaporan & Statistik' },
  { id: 'layout-grid', label: 'Aplikasi Internal' },
  { id: 'stethoscope', label: 'Pelayanan Klinis' },
  { id: 'users', label: 'Kepegawaian & SDMK' },
  { id: 'building-2', label: 'Fasilitas & Sarpras' },
  { id: 'file-spreadsheet', label: 'Keuangan & Klaim' },
  { id: 'globe', label: 'Portal Web Umum' },
];

export function CategoryIcon({
  icon,
  className = 'w-4 h-4',
}: {
  icon?: string;
  className?: string;
}) {
  switch (icon) {
    case 'heart-pulse':
      return <HeartPulse className={className} />;
    case 'shield-plus':
      return <ShieldPlus className={className} />;
    case 'landmark':
      return <Landmark className={className} />;
    case 'file-text':
      return <FileText className={className} />;
    case 'sprout':
      return <Sprout className={className} />;
    case 'activity':
      return <Activity className={className} />;
    case 'bar-chart-3':
      return <BarChart3 className={className} />;
    case 'layout-grid':
      return <LayoutGrid className={className} />;
    case 'stethoscope':
      return <Stethoscope className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'building-2':
      return <Building2 className={className} />;
    case 'file-spreadsheet':
      return <FileSpreadsheet className={className} />;
    case 'globe':
      return <Globe className={className} />;
    default:
      return <Folder className={className} />;
  }
}

/**
 * Renders an application logo with strict `object-fit: contain` (never cropped)
 * and a resilient, high-contrast vector healthcare emblem fallback if `logoUrl` is empty or fails to load.
 */
export function ApplicationLogoBadge({
  name,
  logoUrl,
  categoryIcon,
  size = 'md',
}: {
  name: string;
  logoUrl?: string;
  categoryIcon?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl p-1.5',
    md: 'w-16 h-16 rounded-2xl p-2.5',
    lg: 'w-20 h-20 rounded-2xl p-3',
  }[size];

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');

  if (logoUrl && !imgError) {
    return (
      <div
        className={`${sizeClasses} bg-slate-50/80 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-200 group-hover:scale-105`}
      >
        <img
          src={logoUrl}
          alt={`Logo ${name}`}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-contain select-none"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-linear-to-br from-[#F0FDFA] to-[#CCFBF1] border border-[#14B8A6]/30 flex flex-col items-center justify-center shrink-0 text-[#0F766E] transition-transform duration-200 group-hover:scale-105`}
    >
      <CategoryIcon
        icon={categoryIcon || 'heart-pulse'}
        className={size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'}
      />
      <span className="text-[10px] font-extrabold tracking-tight mt-0.5 leading-none">
        {initials || 'APP'}
      </span>
    </div>
  );
}
