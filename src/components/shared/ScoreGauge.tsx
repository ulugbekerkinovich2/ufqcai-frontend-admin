export function ScoreGauge({ value, size = 144 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 75 ? "#0F766E" : v >= 50 ? "#D97706" : "#B91C1C";
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c * (1 - v / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="#EFEFEA" strokeWidth="8" fill="none" />
        <circle
          cx="60" cy="60" r={r}
          stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-serif">
        <span className="text-[32px] leading-none font-medium text-ink tabular-nums">{Math.round(v)}</span>
        <span className="text-xs text-ink-muted mt-1 font-sans">/ 100</span>
      </div>
    </div>
  );
}
