/**
 * Senariy Analizer — vizual identifikatsiya.
 * Davlat tashkilotiga mos, minimal, deep teal aksent bilan.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ssenariy Tahlil"
    >
      <rect width="40" height="40" rx="10" fill="#0F766E" />
      {/* Sahifa qatlamlari — ssenariy ma'nosi */}
      <rect x="11" y="8" width="18" height="22" rx="2.5" fill="#FAFAF8" />
      <rect x="13" y="11" width="14" height="22" rx="2.5" fill="#0F766E" fillOpacity="0.18" stroke="#FAFAF8" strokeWidth="1.5" />
      {/* AI tahlil belgisi — uchburchak (play/analyze) */}
      <path d="M18 17 L26 21 L18 25 Z" fill="#0F766E" />
    </svg>
  );
}

export function LogoFull({ size = 36 }: { size?: number }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-serif text-[17px] leading-tight text-ink">Ssenariy Tahlil</span>
    </div>
  );
}
