export function ScoreGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 75 ? "#16a34a" : v >= 50 ? "#ea580c" : "#dc2626";
  const r = 50;
  const c = 2 * Math.PI * r;
  const off = c * (1 - v / 100);
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="#e5e7eb" strokeWidth="10" fill="none" />
        <circle cx="60" cy="60" r={r} stroke={color} strokeWidth="10" fill="none"
                strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{Math.round(v)}</span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
    </div>
  );
}
