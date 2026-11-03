import React from 'react';

export function PuskesmasHeroIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 270"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full object-cover select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroSkyGrad" x1="80" y1="0" x2="600" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="55%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>
        <linearGradient id="leftFadeGrad" x1="0" y1="135" x2="220" y2="135" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F2FE" stopOpacity="1" />
          <stop offset="45%" stopColor="#E0F2FE" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="roofTeal" x1="250" y1="45" x2="540" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="50%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#115E59" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="340" y1="135" x2="450" y2="215" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F766E" />
          <stop offset="50%" stopColor="#065F46" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>
        <linearGradient id="arcGlow" x1="180" y1="95" x2="590" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="waveTealDark" x1="0" y1="210" x2="640" y2="270" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="50%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="waveLimeRight" x1="320" y1="265" x2="640" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#16A34A" />
          <stop offset="55%" stopColor="#65A30D" />
          <stop offset="100%" stopColor="#A3E635" />
        </linearGradient>
      </defs>

      {/* Bright Blue Sky Background */}
      <rect x="0" y="0" width="640" height="270" fill="url(#heroSkyGrad)" />

      {/* Soft Fluffy Clouds */}
      <g fill="#FFFFFF" opacity="0.72">
        <ellipse cx="220" cy="48" rx="46" ry="15" />
        <ellipse cx="245" cy="40" rx="28" ry="18" />
        <ellipse cx="535" cy="44" rx="52" ry="16" />
        <ellipse cx="560" cy="34" rx="34" ry="20" />
        <ellipse cx="595" cy="48" rx="38" ry="14" />
      </g>

      {/* Luminous Digital Connectivity Arc Over Puskesmas Building */}
      <path
        d="M170 128C235 42 465 26 575 96"
        stroke="url(#arcGlow)"
        strokeWidth="2.5"
        strokeDasharray="1 0"
      />
      <path
        d="M185 138C250 56 455 40 565 106"
        stroke="#FFFFFF"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />

      {/* 5 Floating Digital Application Icons in Frosted Rounded Squares */}
      {/* 1. Globe / Web Portal Icon */}
      <g transform="translate(182, 56)">
        <rect
          x="0"
          y="0"
          width="42"
          height="42"
          rx="11"
          fill="#FFFFFF"
          fillOpacity="0.88"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <circle cx="21" cy="21" r="11" stroke="#0F766E" strokeWidth="2" />
        <ellipse cx="21" cy="21" rx="5.5" ry="11" stroke="#0F766E" strokeWidth="1.6" />
        <line x1="10" y1="21" x2="32" y2="21" stroke="#0F766E" strokeWidth="1.6" />
        <line x1="12" y1="16" x2="30" y2="16" stroke="#0F766E" strokeWidth="1.3" />
        <line x1="12" y1="26" x2="30" y2="26" stroke="#0F766E" strokeWidth="1.3" />
      </g>

      {/* 2. Folder / Dokumen & Arsip Icon */}
      <g transform="translate(268, 28)">
        <rect
          x="0"
          y="0"
          width="42"
          height="42"
          rx="11"
          fill="#FFFFFF"
          fillOpacity="0.88"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <path
          d="M11 15C11 13.8954 11.8954 13 13 13H18.5L21 16H29C30.1046 16 31 16.8954 31 18V27C31 28.1046 30.1046 29 29 29H13C11.8954 29 11 28.1046 11 27V15Z"
          fill="#0F766E"
        />
        <line x1="14" y1="20" x2="28" y2="20" stroke="#99F6E4" strokeWidth="1.5" />
      </g>

      {/* 3. Bar Chart / Pelaporan & Statistik Icon */}
      <g transform="translate(362, 16)">
        <rect
          x="0"
          y="0"
          width="42"
          height="42"
          rx="11"
          fill="#FFFFFF"
          fillOpacity="0.9"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <rect x="12" y="22" width="4.5" height="8" rx="1" fill="#0F766E" />
        <rect x="18.8" y="17" width="4.5" height="13" rx="1" fill="#0D9488" />
        <rect x="25.5" y="12" width="4.5" height="18" rx="1" fill="#14B8A6" />
        <line x1="10" y1="30.5" x2="32" y2="30.5" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* 4. Medical Shield / Pelayanan Kesehatan Icon */}
      <g transform="translate(454, 24)">
        <rect
          x="0"
          y="0"
          width="42"
          height="42"
          rx="11"
          fill="#FFFFFF"
          fillOpacity="0.88"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <path
          d="M21 11L30 14.5V21C30 26.2 26.2 30.5 21 32C15.8 30.5 12 26.2 12 21V14.5L21 11Z"
          fill="#0F766E"
        />
        <path d="M19.5 17H22.5V20H25.5V23H22.5V26H19.5V23H16.5V20H19.5V17Z" fill="#FFFFFF" />
      </g>

      {/* 5. Cloud Download / Sinkronisasi Kemenkes & Dinkes Icon */}
      <g transform="translate(536, 48)">
        <rect
          x="0"
          y="0"
          width="42"
          height="42"
          rx="11"
          fill="#FFFFFF"
          fillOpacity="0.88"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <path
          d="M15.5 28H27.5C30 28 32 26.1 32 23.6C32 21.3 30.2 19.4 28 19.2C27.2 15.7 24.1 13 20.5 13C16.4 13 13 16.3 13 20.4C11.3 21 10 22.6 10 24.5C10 26.5 11.6 28 13.5 28H15.5Z"
          fill="#0F766E"
        />
        <path
          d="M21 18V24.5M21 24.5L18.5 22M21 24.5L23.5 22"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Background Lush Trees Left & Right */}
      <g>
        <circle cx="198" cy="166" r="24" fill="#15803D" />
        <circle cx="222" cy="154" r="30" fill="#16A34A" />
        <circle cx="255" cy="146" r="28" fill="#22C55E" />
        <circle cx="608" cy="138" r="38" fill="#15803D" />
        <circle cx="585" cy="150" r="28" fill="#16A34A" />
      </g>

      {/* Left Wing of Puskesmas Iniyandit Building */}
      <rect x="218" y="132" width="112" height="72" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
      <polygon points="208,132 272,102 332,132" fill="url(#roofTeal)" />
      <rect x="212" y="129" width="118" height="5" fill="#0F766E" />
      {/* Left Wing Windows */}
      <rect x="234" y="148" width="22" height="32" rx="2" fill="#0F3F3C" />
      <rect x="266" y="148" width="22" height="32" rx="2" fill="#0F3F3C" />
      <rect x="298" y="148" width="20" height="32" rx="2" fill="#0F3F3C" />

      {/* Right Wing of Puskesmas Iniyandit Building */}
      <rect x="484" y="120" width="118" height="84" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
      <polygon points="480,120 545,90 612,120" fill="url(#roofTeal)" />
      <rect x="482" y="117" width="126" height="6" fill="#0D9488" />
      {/* Right Wing Windows */}
      <rect x="504" y="140" width="28" height="42" rx="2" fill="#0F3F3C" />
      <line x1="518" y1="140" x2="518" y2="182" stroke="#94A3B8" strokeWidth="1.5" />
      <rect x="546" y="140" width="28" height="42" rx="2" fill="#0F3F3C" />
      <line x1="560" y1="140" x2="560" y2="182" stroke="#94A3B8" strokeWidth="1.5" />

      {/* Main Central Facade — PUSKESMAS INIYANDIT */}
      <rect x="316" y="84" width="176" height="122" rx="3" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
      {/* Main Teal Pitched Roof */}
      <polygon points="300,86 404,44 508,86" fill="url(#roofTeal)" />
      <rect x="302" y="82" width="204" height="7" rx="2" fill="#0F766E" />
      <rect x="316" y="89" width="176" height="4" fill="#14B8A6" />

      {/* Building Signboard: Hexagonal Cross + PUSKESMAS INIYANDIT */}
      <rect x="336" y="97" width="136" height="36" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
      {/* Hexagon Medical Emblem */}
      <polygon
        points="356,103 366,108.5 366,119.5 356,125 346,119.5 346,108.5"
        fill="#ECFDF5"
        stroke="#0F766E"
        strokeWidth="1.8"
      />
      <path d="M354.2 108.5H357.8V112.2H361.5V115.8H357.8V119.5H354.2V115.8H350.5V112.2H354.2V108.5Z" fill="#059669" />

      {/* Facade Typography */}
      <text
        x="373"
        y="113"
        fill="#064E3B"
        fontSize="11.5"
        fontWeight="800"
        fontFamily="Plus Jakarta Sans, sans-serif"
        letterSpacing="0.3"
      >
        PUSKESMAS
      </text>
      <text
        x="373"
        y="125"
        fill="#0F766E"
        fontSize="11"
        fontWeight="800"
        fontFamily="Plus Jakarta Sans, sans-serif"
        letterSpacing="0.4"
      >
        INIYANDIT
      </text>

      {/* Main Entrance Canopy & Glass Doors */}
      <rect x="328" y="137" width="152" height="6" rx="2" fill="#E2E8F0" />
      {/* Teal Vertical Pillar Accents */}
      <rect x="336" y="143" width="8" height="62" fill="#0D9488" />
      <rect x="464" y="143" width="8" height="62" fill="#0D9488" />
      {/* Glass Entrance */}
      <rect x="352" y="143" width="104" height="62" fill="url(#glassGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
      <line x1="386" y1="143" x2="386" y2="205" stroke="#99F6E4" strokeWidth="1.5" strokeOpacity="0.6" />
      <line x1="422" y1="143" x2="422" y2="205" stroke="#99F6E4" strokeWidth="1.5" strokeOpacity="0.6" />
      <line x1="352" y1="166" x2="456" y2="166" stroke="#99F6E4" strokeWidth="1.2" strokeOpacity="0.5" />

      {/* Courtyard Steps & Paved Driveway */}
      <polygon points="324,205 484,205 502,216 306,216" fill="#F1F5F9" />
      <polygon points="150,216 640,216 640,260 120,260" fill="#CBD5E1" />
      <polygon points="240,216 530,216 590,260 180,260" fill="#E2E8F0" />

      {/* Ornamental Shrubs & Courtyard Trees */}
      <ellipse cx="255" cy="206" rx="45" ry="9" fill="#16A34A" />
      <ellipse cx="525" cy="208" rx="35" ry="9" fill="#15803D" />

      {/* Soft Left Mist Blend into Text Area */}
      <rect x="0" y="0" width="220" height="270" fill="url(#leftFadeGrad)" />

      {/* Flowing Bottom Teal, Emerald & Lime Wave Ribbons */}
      <path
        d="M65 270C175 238 305 208 455 232C535 246 595 230 640 205V270H65Z"
        fill="url(#waveTealDark)"
      />
      <path
        d="M260 270C375 236 495 215 640 162V270H260Z"
        fill="url(#waveLimeRight)"
      />
      <path
        d="M330 270C435 244 535 224 640 184V270H330Z"
        fill="#ECFDF5"
        fillOpacity="0.9"
      />

      {/* Signature Green Healthcare Leaves on Bottom Right Corner */}
      <g transform="translate(546, 198)">
        <path
          d="M28 62C32 32 54 12 84 4C78 34 60 54 28 62Z"
          fill="#65A30D"
        />
        <path
          d="M30 60C46 42 62 26 78 12"
          stroke="#ECFDF5"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M24 58C10 42 6 24 12 8C28 18 32 36 24 58Z"
          fill="#84CC16"
        />
        <path
          d="M23 55C18 40 15 26 14 14"
          stroke="#064E3B"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function PuskesmasLoginIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full object-cover select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="loginSky" x1="0" y1="20" x2="420" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#F0FDFA" />
        </linearGradient>
        <linearGradient id="loginWave" x1="0" y1="150" x2="420" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#84CC16" />
          <stop offset="60%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#FACC15" />
        </linearGradient>
      </defs>

      <path d="M0 38C120 8 290 8 420 34V170H0V38Z" fill="url(#loginSky)" />
      <path d="M0 38C120 8 290 8 420 34V43C290 17 120 17 0 46V38Z" fill="url(#loginWave)" />

      {/* Trees */}
      <circle cx="52" cy="118" r="24" fill="#15803D" />
      <circle cx="72" cy="122" r="19" fill="#16A34A" />
      <circle cx="368" cy="116" r="25" fill="#15803D" />
      <circle cx="348" cy="122" r="19" fill="#22C55E" />

      {/* Left Wing */}
      <rect x="78" y="92" width="76" height="54" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
      <polygon points="72,92 116,66 160,92" fill="#0F766E" />
      <rect x="92" y="104" width="14" height="18" rx="2" fill="#0F3F3C" />
      <rect x="114" y="104" width="14" height="18" rx="2" fill="#0F3F3C" />

      {/* Right Wing */}
      <rect x="266" y="92" width="76" height="54" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
      <polygon points="260,92 304,66 348,92" fill="#0F766E" />
      <rect x="292" y="104" width="14" height="18" rx="2" fill="#0F3F3C" />
      <rect x="314" y="104" width="14" height="18" rx="2" fill="#0F3F3C" />

      {/* Center Main Facade */}
      <rect x="148" y="58" width="124" height="88" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
      <polygon points="138,60 210,26 282,60" fill="#0F766E" />
      <rect x="148" y="62" width="124" height="4" fill="#84CC16" />

      {/* Signboard */}
      <rect x="162" y="72" width="96" height="26" rx="5" fill="#F0FDFA" stroke="#14B8A6" strokeWidth="1.2" />
      <circle cx="176" cy="85" r="7.5" fill="#0F766E" />
      <path d="M174.5 80.5H177.5V83.5H180.5V86.5H177.5V89.5H174.5V86.5H171.5V83.5H174.5V80.5Z" fill="#FFFFFF" />
      <text x="188" y="83" fill="#0F172A" fontSize="8.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
        PUSKESMAS
      </text>
      <text x="188" y="93" fill="#0F766E" fontSize="8" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
        INIYANDIT
      </text>

      {/* Entrance */}
      <rect x="178" y="108" width="64" height="38" fill="#0F3F3C" stroke="#94A3B8" strokeWidth="1.2" />
      <line x1="210" y1="108" x2="210" y2="146" stroke="#14B8A6" strokeWidth="1.5" />

      {/* Lawn & Pathway */}
      <rect x="0" y="144" width="420" height="26" fill="url(#loginWave)" />
      <polygon points="164,170 184,144 236,144 256,170" fill="#E2E8F0" />
    </svg>
  );
}

export function BerakhlakBadge({ className = '' }: { className?: string }) {
  return (
    <div
      className={`hidden xl:flex items-center gap-2.5 pl-3 border-l border-slate-200 select-none ${className}`}
      title="BerAKHLAK — Bangga Melayani Bangsa"
    >
      <div className="text-right leading-none">
        <div className="text-xs font-extrabold tracking-tight">
          <span className="text-[#B91C1C]">Ber</span>
          <span className="text-[#0F172A]">AKHLAK</span>
        </div>
        <div className="text-[9px] text-slate-500 font-medium mt-0.5">
          Berorientasi Pelayanan
        </div>
      </div>
      <div className="px-2 py-1 rounded-md bg-rose-50 border border-rose-200/70 text-[10px] font-bold leading-tight text-[#B91C1C]">
        #bangga
        <span className="block text-[9px] font-semibold text-slate-700">melayani bangsa</span>
      </div>
    </div>
  );
}
