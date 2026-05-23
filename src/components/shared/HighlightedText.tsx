import { useMemo, useState, useEffect } from "react";
import type { FlaggedSegment } from "@/types";
import { RiskBadge } from "./RiskBadge";

const riskBg: Record<string, string> = {
  Low: "bg-risk-low-bg/70 hover:bg-risk-low-bg",
  Medium: "bg-risk-medium-bg/70 hover:bg-risk-medium-bg",
  High: "bg-risk-high-bg/70 hover:bg-risk-high-bg",
};
const riskRing: Record<string, string> = {
  Low: "ring-2 ring-risk-low-dot",
  Medium: "ring-2 ring-risk-medium-dot",
  High: "ring-2 ring-risk-high-dot",
};

export function HighlightedText({
  text,
  segments,
  activeIds,
}: {
  text: string;
  segments: FlaggedSegment[];
  activeIds?: string[];
}) {
  const [active, setActive] = useState<FlaggedSegment | null>(null);
  const activeSet = useMemo(() => new Set(activeIds ?? []), [activeIds]);

  useEffect(() => {
    if (!activeIds?.length) return;
    const seg = segments.find((s) => s.id === activeIds[0]);
    if (seg) setActive(seg);
  }, [activeIds, segments]);

  // AI quote ko'p hollarda matnga aynan mos kelmaydi (tinish belgilari/bo'shliqlar).
  // char_start/end NULL bo'lsa, quote'ni matn ichidan fuzzy qidiramiz.
  function findQuotePosition(haystack: string, quote: string): [number, number] | null {
    if (!quote) return null;
    const q = quote.trim();
    if (q.length < 8) return null;

    let idx = haystack.indexOf(q);
    if (idx >= 0) return [idx, idx + q.length];

    const normQ = q.replace(/\s+/g, " ");
    // Birinchi 40 belgi bo'yicha
    const head = normQ.slice(0, Math.min(40, normQ.length));
    idx = haystack.indexOf(head);
    if (idx >= 0) return [idx, idx + q.length];

    // Faqat dastlabki 4-5 so'z bo'yicha
    const firstFew = normQ.split(" ").slice(0, 5).join(" ");
    if (firstFew.length >= 10) {
      idx = haystack.indexOf(firstFew);
      if (idx >= 0) return [idx, Math.min(haystack.length, idx + q.length)];
    }
    return null;
  }

  const parts = useMemo(() => {
    const enriched = segments
      .map((s) => {
        if (s.char_start != null && s.char_end != null && s.char_end > s.char_start) {
          return { seg: s, start: s.char_start as number, end: s.char_end as number };
        }
        const found = findQuotePosition(text, s.quote || "");
        return found ? { seg: s, start: found[0], end: found[1] } : null;
      })
      .filter((x): x is { seg: FlaggedSegment; start: number; end: number } => x !== null)
      .sort((a, b) => a.start - b.start);

    const out: { text: string; seg?: FlaggedSegment }[] = [];
    let cur = 0;
    for (const e of enriched) {
      if (e.start < cur) continue;
      if (e.start > cur) out.push({ text: text.slice(cur, e.start) });
      out.push({ text: text.slice(e.start, e.end), seg: e.seg });
      cur = e.end;
    }
    if (cur < text.length) out.push({ text: text.slice(cur) });
    return out;
  }, [text, segments]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
      <div className="card p-7 max-h-[640px] overflow-auto">
        <div className="whitespace-pre-wrap leading-[2] text-[15px] text-ink" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          {parts.map((p, i) =>
            p.seg ? (
              <mark
                key={i}
                data-seg-id={p.seg.id}
                onClick={() => setActive(p.seg!)}
                className={`cursor-pointer rounded-md px-0.5 py-0.5 transition text-ink ${riskBg[p.seg.risk_level || ""] || "bg-risk-low-bg/70"} ${activeSet.has(p.seg.id) ? riskRing[p.seg.risk_level || ""] || "ring-2 ring-accent" : ""}`}
              >
                {p.text}
              </mark>
            ) : (
              <span key={i}>{p.text}</span>
            ),
          )}
        </div>
      </div>
      <aside className="card p-6 self-start sticky top-6 animate-fade-in">
        {active ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <RiskBadge level={active.risk_level} />
            </div>
            <h4 className="font-serif text-lg mb-2">Aniqlangan parcha</h4>
            <blockquote className="text-sm text-ink-muted italic border-l-2 border-accent/40 pl-3 mb-4">
              «{active.quote}»
            </blockquote>
            <div className="text-sm text-ink leading-relaxed">{active.explanation}</div>
          </>
        ) : (
          <div className="text-sm text-ink-muted">
            Yuqoridagi <span className="text-ink">mezonni bosing</span> — matnda ushbu mezonga oid belgilangan parcha topiladi.
          </div>
        )}
      </aside>
    </div>
  );
}
