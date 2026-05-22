import { useMemo, useState } from "react";
import type { FlaggedSegment } from "@/types";

const riskBg: Record<string, string> = {
  Low: "bg-yellow-200/60",
  Medium: "bg-orange-300/60",
  High: "bg-red-300/60",
};

export function HighlightedText({ text, segments }: { text: string; segments: FlaggedSegment[] }) {
  const [active, setActive] = useState<FlaggedSegment | null>(null);

  const parts = useMemo(() => {
    const segs = segments
      .filter((s) => s.char_start != null && s.char_end != null && s.char_end! > s.char_start!)
      .sort((a, b) => (a.char_start! - b.char_start!));
    const out: { text: string; seg?: FlaggedSegment }[] = [];
    let cur = 0;
    for (const s of segs) {
      if (s.char_start! < cur) continue;
      if (s.char_start! > cur) out.push({ text: text.slice(cur, s.char_start!) });
      out.push({ text: text.slice(s.char_start!, s.char_end!), seg: s });
      cur = s.char_end!;
    }
    if (cur < text.length) out.push({ text: text.slice(cur) });
    return out;
  }, [text, segments]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <div className="whitespace-pre-wrap leading-relaxed text-sm font-mono bg-white p-4 rounded border max-h-[600px] overflow-auto">
        {parts.map((p, i) =>
          p.seg ? (
            <mark
              key={i}
              onClick={() => setActive(p.seg!)}
              className={`cursor-pointer rounded px-0.5 ${riskBg[p.seg.risk_level || ""] || "bg-yellow-100"}`}
            >
              {p.text}
            </mark>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </div>
      <aside className="bg-white rounded border p-4 text-sm sticky top-4 self-start">
        {active ? (
          <>
            <div className="font-semibold mb-2">Izoh</div>
            <div className="mb-3 text-gray-700">{active.explanation}</div>
            <div className="text-xs text-gray-500">Risk: {active.risk_level}</div>
          </>
        ) : (
          <div className="text-gray-500">Belgilangan parchaga bosing — bu yerda izoh chiqadi.</div>
        )}
      </aside>
    </div>
  );
}
