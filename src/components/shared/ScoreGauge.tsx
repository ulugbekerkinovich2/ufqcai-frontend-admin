export function scoreColor(v: number): string {
  if (v <= 15) return "#0284C7"; // sky blue
  if (v <= 30) return "#0EA5E9"; // light blue
  if (v <= 45) return "#16A34A"; // green
  if (v <= 58) return "#CA8A04"; // yellow
  if (v <= 70) return "#EA580C"; // orange
  if (v <= 82) return "#DC2626"; // red
  return "#991B1B";              // dark red (max)
}

export function ScoreGauge({ value, size = 144 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color = scoreColor(v);
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
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1), stroke 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-serif">
        <span className="text-[32px] leading-none font-medium tabular-nums" style={{ color }}>{Math.round(v)}</span>
        <span className="text-xs text-ink-muted mt-1 font-sans">/ 100</span>
      </div>
    </div>
  );
}
