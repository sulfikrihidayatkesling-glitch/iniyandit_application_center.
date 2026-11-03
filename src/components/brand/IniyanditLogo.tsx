import React from 'react';

export type LogoVariant =
  | 'icon'
  | 'square'
  | 'horizontal'
  | 'sidebar'
  | 'login'
  | 'favicon'
  | 'pwa'
  | 'shortcut';

interface IniyanditLogoProps {
  variant?: LogoVariant;
  size?: number;
  portalName?: string;
  institutionName?: string;
  tagline?: string;
  customLogoUrl?: string;
  officialLogoUrl?: string;
  useCustomOverride?: boolean;
  showTaglinePill?: boolean;
  className?: string;
}

export function IniyanditIconSvg({
  size = 44,
  withFrame = true,
  maskable = false,
  className = '',
  idPrefix = 'iac',
}: {
  size?: number;
  withFrame?: boolean;
  maskable?: boolean;
  className?: string;
  idPrefix?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      role="img"
      aria-label="Logo Iniyandit Application Center"
    >
      <defs>
        <linearGradient
          id={`${idPrefix}-bgFrame`}
          x1="12"
          y1="12"
          x2="228"
          y2="228"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0FDFA" />
        </linearGradient>
        <linearGradient
          id={`${idPrefix}-cross`}
          x1="40"
          y1="54"
          x2="152"
          y2="176"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="45%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient
          id={`${idPrefix}-orbitTop`}
          x1="46"
          y1="84"
          x2="168"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient
          id={`${idPrefix}-orbitBottom`}
          x1="30"
          y1="118"
          x2="170"
          y2="196"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#84CC16" />
        </linearGradient>
        <linearGradient
          id={`${idPrefix}-leafMain`}
          x1="88"
          y1="186"
          x2="188"
          y2="72"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#065F46" />
          <stop offset="45%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#A3E635" />
        </linearGradient>
        <linearGradient
          id={`${idPrefix}-leafEdge`}
          x1="88"
          y1="186"
          x2="192"
          y2="96"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#047857" />
          <stop offset="60%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#84CC16" />
        </linearGradient>
      </defs>

      {/* Optional Rounded Square / Maskable Base */}
      {maskable ? (
        <rect x="0" y="0" width="240" height="240" rx="52" fill={`url(#${idPrefix}-bgFrame)`} />
      ) : withFrame ? (
        <rect
          x="10"
          y="10"
          width="220"
          height="220"
          rx="50"
          fill={`url(#${idPrefix}-bgFrame)`}
          stroke="#14B8A6"
          strokeWidth="4.5"
          strokeOpacity="0.4"
        />
      ) : null}

      <g transform={maskable ? 'translate(18, 18) scale(0.85)' : undefined}>
        {/* Top Orbital Swoosh */}
        <path
          d="M52 84C76 48 126 34 162 48C166 50 166 56 160 57C126 46 82 56 52 84Z"
          fill={`url(#${idPrefix}-orbitTop)`}
        />

        {/* Digital Health Pixel Nodes (Top Right) */}
        <rect x="162" y="34" width="15" height="15" rx="3.5" fill="#0D9488" />
        <rect x="183" y="42" width="16" height="16" rx="3.5" fill="#EAB308" />
        <rect x="164" y="54" width="16" height="16" rx="3.5" fill="#22C55E" />
        <rect x="144" y="61" width="15" height="15" rx="3.5" fill="#0F766E" />
        <rect x="182" y="65" width="11" height="11" rx="2.5" fill="#84CC16" />

        {/* Rounded Medical Cross */}
        <path
          d="M82 68C82 59.1634 89.1634 52 98 52H120C128.837 52 136 59.1634 136 68V88H154C162.837 88 170 95.1634 170 104V124C170 132.837 162.837 140 154 140H136V162C136 170.837 128.837 178 120 178H98C89.1634 178 82 170.837 82 162V140H62C53.1634 140 46 132.837 46 124V104C46 95.1634 53.1634 88 62 88H82V68Z"
          fill={`url(#${idPrefix}-cross)`}
        />

        {/* White Humanity / Care Silhouette Inside Cross */}
        <circle cx="115" cy="94" r="11.5" fill="#FFFFFF" />
        <path
          d="M68 99C92 98 106 108 117 119C128 104 146 90 166 86C145 96 131 112 118 134C108 150 96 168 86 184C96 154 103 128 96 113C90 103 80 100 68 99Z"
          fill="#FFFFFF"
        />

        {/* Vibrant Green Healthcare Leaf Swooping Upward */}
        <path
          d="M86 186C106 138 138 108 176 74C186 102 186 134 166 158C148 178 118 184 86 186Z"
          fill={`url(#${idPrefix}-leafMain)`}
        />
        <path
          d="M86 186C116 152 146 134 174 124C160 162 128 182 86 186Z"
          fill={`url(#${idPrefix}-leafEdge)`}
        />

        {/* Crisp White Leaf Vein */}
        <path
          d="M88 184C114 156 140 138 164 128"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Lower Orbital Swoosh */}
        <path
          d="M44 122C26 162 56 206 116 200C144 197 166 186 180 174C156 190 124 195 94 191C52 185 34 156 44 122Z"
          fill={`url(#${idPrefix}-orbitBottom)`}
        />
      </g>
    </svg>
  );
}

export function IniyanditLogo({
  variant = 'horizontal',
  size = 44,
  portalName = 'Iniyandit Application Center',
  institutionName = 'UPTD Puskesmas Iniyandit',
  tagline = 'One Account. One Portal. All Applications.',
  customLogoUrl = '',
  useCustomOverride = false,
  showTaglinePill = false,
  className = '',
}: IniyanditLogoProps) {
  const uniqueId = React.useId().replace(/:/g, '');

  const renderIcon = (iconSize: number, withFrame = true, maskable = false) => {
    if (useCustomOverride && customLogoUrl) {
      return (
        <div
          style={{ width: iconSize, height: iconSize }}
          className="rounded-xl bg-white border-2 border-[#0F766E]/30 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs"
        >
          <img
            src={customLogoUrl}
            alt={portalName}
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }
    return (
      <IniyanditIconSvg
        size={iconSize}
        withFrame={withFrame}
        maskable={maskable}
        idPrefix={`logo-${uniqueId}`}
      />
    );
  };

  if (variant === 'icon') {
    return renderIcon(size, false, false);
  }

  if (variant === 'square' || variant === 'favicon' || variant === 'shortcut') {
    return renderIcon(size, true, false);
  }

  if (variant === 'pwa') {
    return renderIcon(size, true, true);
  }

  if (variant === 'sidebar') {
    const isStandardName = portalName.toLowerCase().includes('iniyandit');
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {renderIcon(size, true, false)}
        <div className="min-w-0">
          <div className="leading-tight tracking-tight truncate">
            {isStandardName ? (
              <>
                <span className="inline-flex items-center gap-1 text-[16px] font-extrabold text-white">
                  <span>Iniyandit</span>
                  <svg className="w-3.5 h-3.5 -mt-1.5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19C6 10 13 5 21 4C19 13 13 18 4 19Z" fill="#84CC16" />
                    <path
                      d="M5 18C10 13 14 9 19 6"
                      stroke="#064E3B"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="block text-xs font-bold text-teal-200">Application Center</span>
              </>
            ) : (
              <span className="text-sm font-extrabold text-white">{portalName}</span>
            )}
          </div>
          <p className="text-[11px] text-teal-100/75 truncate mt-0.5">{institutionName}</p>
        </div>
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 rounded-3xl bg-white/95 shadow-xl border border-teal-200/40">
            {renderIcon(size, false, false)}
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight flex items-center justify-center gap-1">
          <span>{portalName}</span>
        </h1>
        <p className="text-sm font-semibold text-teal-100 mt-1">{institutionName}</p>
        <div className="mt-3 px-4 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20">
          <p className="text-xs italic text-white font-medium">{tagline}</p>
        </div>
      </div>
    );
  }

  // Default: 'horizontal' (Header Dashboard Petugas & Brand Lockup)
  const hasStandardPortalName =
    portalName.trim().toLowerCase() === 'iniyandit application center';

  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${className}`}>
      <div className="flex items-center shrink-0">
        {renderIcon(size, true, false)}
      </div>

      {/* First Vertical Teal Divider between Icon and Brand Title */}
      <div className="hidden sm:block h-9 w-[2px] rounded-full bg-[#0F766E]/60 shrink-0" />

      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0">
          {hasStandardPortalName ? (
            <div className="leading-[1.12]">
              <div className="text-base sm:text-[20px] font-extrabold text-[#1E293B] tracking-tight">
                Iniyandit
              </div>
              <div className="text-xs sm:text-[14px] font-bold text-[#0D9488] tracking-tight">
                Application Center
              </div>
            </div>
          ) : (
            <div className="text-sm sm:text-base font-extrabold text-[#1E293B] leading-tight tracking-tight truncate">
              {portalName}
            </div>
          )}

          {/* Mobile Subtitle for Institution */}
          <div className="text-[10px] sm:text-xs font-semibold text-[#475569] truncate lg:hidden mt-0.5">
            {institutionName}
          </div>

          {showTaglinePill && (
            <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-linear-to-r from-[#0F766E] to-[#0D9488] text-[10px] italic font-semibold text-white">
              {tagline}
            </div>
          )}
        </div>

        {/* Second Vertical Teal Divider before Institution Name */}
        <div className="hidden lg:block h-9 w-[2px] rounded-full bg-[#0F766E]/50 shrink-0" />
        <div className="hidden lg:block text-xs sm:text-[14px] font-semibold text-[#1E293B] whitespace-nowrap">
          {institutionName}
        </div>
      </div>
    </div>
  );
}

export function getIniyanditLogoSvgString(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="iacBgFrame" x1="16" y1="16" x2="224" y2="224" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F0FDFA" />
    </linearGradient>
    <linearGradient id="iacCross" x1="40" y1="54" x2="152" y2="176" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="45%" stop-color="#0D9488" />
      <stop offset="100%" stop-color="#064E3B" />
    </linearGradient>
    <linearGradient id="iacOrbitTop" x1="46" y1="84" x2="168" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#14B8A6" />
      <stop offset="100%" stop-color="#0D9488" />
    </linearGradient>
    <linearGradient id="iacOrbitBottom" x1="30" y1="118" x2="170" y2="196" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="50%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#84CC16" />
    </linearGradient>
    <linearGradient id="iacLeafMain" x1="88" y1="186" x2="188" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#065F46" />
      <stop offset="45%" stop-color="#16A34A" />
      <stop offset="100%" stop-color="#A3E635" />
    </linearGradient>
    <linearGradient id="iacLeafEdge" x1="88" y1="186" x2="192" y2="96" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#047857" />
      <stop offset="60%" stop-color="#22C55E" />
      <stop offset="100%" stop-color="#84CC16" />
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="216" height="216" rx="48" fill="url(#iacBgFrame)" stroke="#14B8A6" stroke-width="4" stroke-opacity="0.35" />
  <path d="M52 84C76 48 126 34 162 48C166 50 166 56 160 57C126 46 82 56 52 84Z" fill="url(#iacOrbitTop)" />
  <rect x="162" y="34" width="15" height="15" rx="3.5" fill="#0D9488" />
  <rect x="183" y="42" width="16" height="16" rx="3.5" fill="#EAB308" />
  <rect x="164" y="54" width="16" height="16" rx="3.5" fill="#22C55E" />
  <rect x="144" y="61" width="15" height="15" rx="3.5" fill="#0F766E" />
  <rect x="182" y="65" width="11" height="11" rx="2.5" fill="#84CC16" />
  <path d="M82 68C82 59.1634 89.1634 52 98 52H120C128.837 52 136 59.1634 136 68V88H154C162.837 88 170 95.1634 170 104V124C170 132.837 162.837 140 154 140H136V162C136 170.837 128.837 178 120 178H98C89.1634 178 82 170.837 82 162V140H62C53.1634 140 46 132.837 46 124V104C46 95.1634 53.1634 88 62 88H82V68Z" fill="url(#iacCross)" />
  <circle cx="115" cy="94" r="11" fill="#FFFFFF" />
  <path d="M68 99C92 98 106 108 117 119C128 104 146 90 166 86C145 96 131 112 118 134C108 150 96 168 86 184C96 154 103 128 96 113C90 103 80 100 68 99Z" fill="#FFFFFF" />
  <path d="M86 186C106 138 138 108 176 74C186 102 186 134 166 158C148 178 118 184 86 186Z" fill="url(#iacLeafMain)" />
  <path d="M86 186C116 152 146 134 174 124C160 162 128 182 86 186Z" fill="url(#iacLeafEdge)" />
  <path d="M88 184C114 156 140 138 164 128" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
  <path d="M44 122C26 162 56 206 116 200C144 197 166 186 180 174C156 190 124 195 94 191C52 185 34 156 44 122Z" fill="url(#iacOrbitBottom)" />
</svg>`;
}
