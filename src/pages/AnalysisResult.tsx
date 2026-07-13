import { useState, useMemo, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Analysis, Document, RiskLevel, FlaggedSegment } from "@/types";
import { ScoreGauge, scoreColor } from "@/components/shared/ScoreGauge";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { HighlightedText } from "@/components/shared/HighlightedText";
import { AnalysisProgress } from "@/components/shared/AnalysisProgress";
import { Download, ArrowLeft, AlertTriangle, Filter, Search, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const RISK_COLOR: Record<string, string> = {
  None: "#9CA3AF", Low: "#D97706", Medium: "#EA580C", High: "#C2410C",
};
const RISK_RANK: Record<string, number> = { None: 0, Low: 1, Medium: 2, High: 3 };

// Legacy analyses had inverted scoring (100=safe). Clamp to expected range per risk level.
function normalizeScore(raw: number, risk: string): number {
  if (risk === "None") return Math.min(raw, 5);
  if (risk === "Low") return Math.min(raw, 30);
  if (risk === "Medium") return Math.min(raw, 60);
  return raw; // High: trust the value
}


export function AnalysisResult() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();

  const [filter, setFilter] = useState<"all" | "high" | "flagged">("all");
  const [sort, setSort] = useState<"score" | "risk">("risk");
  const [activeSegment, setActiveSegment] = useState<FlaggedSegment | null>(null);
  const [activeCriterionSegIds, setActiveCriterionSegIds] = useState<string[]>([]);
  const [showLow, setShowLow] = useState(false);
  const [showHiddenRecs, setShowHiddenRecs] = useState(false);
  const textRef = useRef<HTMLDivElement | null>(null);
  const criteriaListRef = useRef<HTMLUListElement | null>(null);

  const aQ = useQuery({
    queryKey: ["analysis", id],
    queryFn: async () => (await api.get<Analysis>(`/analyses/${id}`)).data,
    staleTime: 0,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "completed" || s === "failed" ? false : 2500;
    },
  });

  const docQ = useQuery({
    queryKey: ["doc-for-analysis", aQ.data?.document_id],
    queryFn: async () => (await api.get<Document>(`/documents/${aQ.data!.document_id}`)).data,
    enabled: !!aQ.data?.document_id,
  });

  const results = aQ.data?.results || [];
  const flagged = aQ.data?.flagged || [];

  // Score 0-10 yoki 0-100 — avtomatik aniqlash
  const scoreMax = useMemo(() => {
    const maxScore = Math.max(...results.map((r) => Number(r.score || 0)), 0);
    return maxScore > 10 ? 100 : 10;
  }, [results]);

  // Normalize helper + flagsByCriterion + flagsForCriterion — filteredResults'dan OLDIN
  // (aks holda TDZ: filter='flagged' useMemo callback chaqirilganda flagsByCriterion hali undefined)
  const normalizeKey = (s?: string | null) =>
    (s || "").replace(/^\s*\d+\s*[.)]\s*/, "").trim().toLowerCase();

  const NO_CHANGE_PHRASES = [
    "o'zgartirish talab etilmaydi", "o`zgartirish talab etilmaydi",
    "изменений не требуется", "no changes required", "no change required",
  ];
  const isNoChangeRec = (rec?: string | null) => {
    if (!rec) return false;
    const lower = rec.toLowerCase();
    return NO_CHANGE_PHRASES.some((p) => lower.includes(p));
  };

  const flagsByCriterion = useMemo(() => {
    const byId: Record<string, FlaggedSegment[]> = {};
    const byName: Record<string, FlaggedSegment[]> = {};
    for (const f of flagged) {
      if (f.criterion_id) {
        (byId[f.criterion_id] ??= []).push(f);
      }
      const nk = normalizeKey(f.criterion_name);
      if (nk) (byName[nk] ??= []).push(f);
    }
    return { byId, byName };
  }, [flagged]);

  function flagsForCriterion(cid?: string | null, cname?: string | null): FlaggedSegment[] {
    try {
      if (cid && flagsByCriterion.byId[cid]) return flagsByCriterion.byId[cid];
      const nk = normalizeKey(cname);
      if (nk && flagsByCriterion.byName[nk]) return flagsByCriterion.byName[nk];
    } catch {}
    return [];
  }

  const lowCount = useMemo(
    () => results.filter((r) => r.risk_level === "Low").length,
    [results],
  );

  const filteredResults = useMemo(() => {
    let arr = results.filter((r) => r.risk_level !== "None");
    if (!showLow) arr = arr.filter((r) => r.risk_level !== "Low");
    if (filter === "high") arr = arr.filter((r) => r.risk_level === "High");
    if (filter === "flagged") arr = arr.filter((r) => flagsForCriterion(r.criterion_id, r.criterion_name).length > 0);
    if (sort === "score") arr.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    if (sort === "risk") arr.sort((a, b) => (RISK_RANK[b.risk_level] - RISK_RANK[a.risk_level]) || (Number(b.score || 0) - Number(a.score || 0)));
    return arr;
  }, [results, flagged, filter, sort, showLow, flagsByCriterion]);

  const hiddenRecsCount = useMemo(
    () => filteredResults.filter((r) => isNoChangeRec(r.recommendation)).length,
    [filteredResults],
  );

  // After text section scrolls into view, highlight the first segment
  useEffect(() => {
    if (!activeCriterionSegIds.length || !textRef.current) return;
    const el = textRef.current.querySelector<HTMLElement>(`[data-seg-id="${activeCriterionSegIds[0]}"]`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
  }, [activeCriterionSegIds]);

  if (!aQ.data) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-6 w-32 bg-ink/[0.06] rounded-lg" />
      <div className="card p-8 flex gap-6">
        <div className="h-36 w-36 rounded-full bg-ink/[0.06] shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-6 w-56 bg-ink/[0.06] rounded-lg" />
          <div className="h-4 w-full bg-ink/[0.06] rounded-lg" />
          <div className="h-4 w-3/4 bg-ink/[0.06] rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="card p-6 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-ink/[0.06] rounded-xl" />)}
        </div>
        <div className="card p-6 space-y-3">
          <div className="h-4 w-32 bg-ink/[0.06] rounded-lg" />
          <div className="h-64 bg-ink/[0.06] rounded-xl" />
        </div>
      </div>
    </div>
  );
  const a = aQ.data;

  if (a.status === "pending" || a.status === "running") {
    return <AnalysisProgress startedAt={a.started_at || a.created_at} analysisId={a.id} />;
  }
  if (a.status === "failed") {
    return (
      <div className="card p-8 border border-risk-high-bg animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-risk-high-bg text-risk-high-fg grid place-items-center">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-lg mb-1.5">{t("analysis.failed")}</h2>
            <p className="text-sm text-ink-muted">{a.error_message}</p>
          </div>
        </div>
      </div>
    );
  }

  const score = Number(a.overall_score || 0);
  const overallScale = score > 10 ? 100 : 10;
  const scorePct = normalizeScore((score / overallScale) * 100, a.overall_risk || "None");

  const genres = a.genre || [];

  function scoreVerdict(pct: number): string {
    if (pct <= 15) return t("analysis.verdict_0");
    if (pct <= 30) return t("analysis.verdict_1");
    if (pct <= 45) return t("analysis.verdict_2");
    if (pct <= 58) return t("analysis.verdict_3");
    if (pct <= 70) return t("analysis.verdict_4");
    if (pct <= 85) return t("analysis.verdict_5");
    return t("analysis.verdict_6");
  }

  const riskCounts = (["None", "Low", "Medium", "High"] as RiskLevel[]).map((lvl) => ({
    risk: lvl, count: results.filter((r) => r.risk_level === lvl).length,
  }));

  async function downloadPdf() {
    try {
      const res = await api.get(`/analyses/${id}/report`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tahlil-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("common.error"));
    }
  }

  // Score bar click → scroll to criterion detail card
  function scrollToCriterionDetail(resultId: string) {
    const el = criteriaListRef.current?.querySelector<HTMLElement>(`[data-result-id="${resultId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // "Find in text" chip → highlight ALL criterion segments + scroll to text
  function jumpAllToText(criterionId?: string | null, criterionName?: string | null) {
    const segs = flagsForCriterion(criterionId, criterionName);
    if (segs.length === 0) return;
    const sorted = [...segs].sort((a, b) => (RISK_RANK[b.risk_level || "None"] || 0) - (RISK_RANK[a.risk_level || "None"] || 0));
    setActiveCriterionSegIds(sorted.map((s) => s.id));
    setActiveSegment(sorted[0]);
    textRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Evidence quote click → highlight single segment + scroll to text
  function jumpSegmentToText(seg: FlaggedSegment) {
    setActiveCriterionSegIds([seg.id]);
    setActiveSegment(seg);
    textRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <Link to={`/documents/${a.document_id}`} className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> {t("doc.back")}
      </Link>

      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("analysis.section")}</p>
          <h1 className="font-serif text-[24px] leading-tight text-balance">{docQ.data?.title}</h1>
          <div className="text-[12px] text-ink-subtle mt-2 tabular-nums">
            {t("analysis.model")}: {a.model_used} · {t("analysis.tokens")}: {a.tokens_used?.toLocaleString()}
          </div>
        </div>
        <button onClick={downloadPdf} className="btn-primary shrink-0">
          <Download size={15} strokeWidth={2} /> {t("analysis.pdf")}
        </button>
      </header>

      <div className="card p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-8 items-center">
          <ScoreGauge value={scorePct} />
          <div>
            <div className="flex items-center gap-3 mb-3">
              <RiskBadge level={a.overall_risk} />
              <div>
                <span className="text-[13px] font-medium text-ink">
                  {t("analysis.summary")} · {(scorePct * overallScale / 100).toFixed(1)} / {overallScale}
                </span>
                <p className="text-[11.5px] text-ink-muted mt-0.5">{scoreVerdict(scorePct)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {(a.summary || "").split(" | ").filter(Boolean).map((para, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-ink text-pretty">{para}</p>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-ink/[0.06]">
              <p className="text-[12px] text-ink-muted italic leading-relaxed">
                Vazirlar Mahkamasining 2019 yil 19 avgustdagi 695-sonli qarori tegishli topshiriqlari bajarilgan holda.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:min-w-[170px]">
            {riskCounts.map((r) => (
              <div key={r.risk} className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLOR[r.risk] }} />
                <span className="text-[12.5px] text-ink-muted flex-1">{t(`risk.${r.risk}`)}</span>
                <span className="text-[14px] font-serif tabular-nums">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="card p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-serif text-lg">{t("analysis.scores")}</h3>
              <span className="text-[12px] text-ink-muted">
                {results.filter((r) => r.risk_level !== "None").length} · 0–{scoreMax}
              </span>
            </div>
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {[...results].filter((r) => r.risk_level !== "None").sort((a, b) => normalizeScore(Number(b.score || 0), b.risk_level) - normalizeScore(Number(a.score || 0), a.risk_level)).map((r) => {
                const sc = normalizeScore(Number(r.score || 0), r.risk_level);
                const pct = Math.max(2, (sc / scoreMax) * 100);
                const color = RISK_COLOR[r.risk_level] || RISK_COLOR.None;
                const hasFlags = flagsForCriterion(r.criterion_id, r.criterion_name).length > 0;
                return (
                  <button
                    key={r.id}
                    onClick={() => scrollToCriterionDetail(r.id)}
                    className="w-full text-left group hover:bg-surface-sunken/40 rounded-lg px-2 py-1.5 -mx-2 transition"
                    title={hasFlags ? "Tafsilotga o'tish" : ""}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] text-ink truncate flex-1 group-hover:text-accent transition">
                        {r.criterion_name}
                        {hasFlags && (
                          <Search size={11} className="inline ml-1.5 text-ink-subtle group-hover:text-accent" />
                        )}
                      </span>
                      <span className="text-[12px] font-mono tabular-nums font-semibold" style={{ color }}>
                        {sc.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-sunken rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-6 flex flex-col">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-9 w-9 rounded-xl bg-accent-50 text-accent grid place-items-center shrink-0">
                <Film size={17} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-serif text-lg leading-tight">{t("analysis.genre")}</h3>
                <p className="text-[12px] text-ink-muted mt-0.5">{t("analysis.genre_hint")}</p>
              </div>
            </div>

            {genres.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {genres.map((g, i) => {
                  const palettes = [
                    { bg: "#F0FDFA", fg: "#0F766E", border: "#99F6E4" },
                    { bg: "#FFF7ED", fg: "#C2410C", border: "#FED7AA" },
                    { bg: "#F0F9FF", fg: "#0369A1", border: "#BAE6FD" },
                    { bg: "#FDF4FF", fg: "#7E22CE", border: "#E9D5FF" },
                    { bg: "#FFF1F2", fg: "#BE123C", border: "#FECDD3" },
                    { bg: "#F7FEE7", fg: "#3F6212", border: "#D9F99D" },
                  ];
                  const p = palettes[i % palettes.length];
                  return (
                    <span
                      key={g}
                      className="inline-flex items-center px-4 py-2 rounded-full text-[14px] font-medium border"
                      style={{ background: p.bg, color: p.fg, borderColor: p.border }}
                    >
                      {g}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="h-14 w-14 rounded-2xl bg-surface-sunken grid place-items-center mb-3">
                  <Film size={24} className="text-ink-subtle" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] text-ink-muted">{t("analysis.genre_empty")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {/* Header: filter + sort controls */}
        <div className="px-6 py-5 flex flex-wrap items-center gap-4 justify-between border-b border-ink/[0.06]">
          <h2 className="font-serif text-lg">{t("analysis.by_criterion")}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-ink-muted" />
            {([
              { v: "all", l: t("analysis.filter_all") },
              { v: "high", l: t("analysis.filter_high") },
              { v: "flagged", l: t("analysis.filter_with_flag") },
            ] as const).map((f) => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v as any)}
                className={cn(
                  "h-8 px-3 rounded-full text-[12.5px] transition",
                  filter === f.v ? "bg-accent text-white" : "bg-surface-sunken text-ink-muted hover:text-ink",
                )}
              >{f.l}</button>
            ))}
            <span className="mx-1 h-4 w-px bg-ink/10" />
            {([
              { v: "risk", l: t("analysis.sort_by_risk") },
              { v: "score", l: t("analysis.sort_by_score") },
            ] as const).map((s) => (
              <button
                key={s.v}
                onClick={() => setSort(s.v as any)}
                className={cn(
                  "h-8 px-3 rounded-full text-[12.5px] transition",
                  sort === s.v ? "bg-ink/10 text-ink" : "text-ink-muted hover:text-ink",
                )}
              >{s.l}</button>
            ))}
          </div>
        </div>

        {/* Visibility toggles */}
        {(lowCount > 0 || hiddenRecsCount > 0) && (
          <div className="px-6 py-3 flex flex-wrap gap-2 bg-surface-sunken/30 border-b border-ink/[0.06]">
            {lowCount > 0 && (
              <button
                onClick={() => setShowLow(!showLow)}
                className="chip text-[12px] transition"
                style={showLow
                  ? { background: "var(--color-surface-raised)", color: "var(--color-ink)" }
                  : { background: "#FEF7E6", color: "#92660A" }
                }
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#D97706" }} />
                {showLow ? t("analysis.hide_low") : `${t("analysis.show_low")} (${lowCount})`}
              </button>
            )}
            {hiddenRecsCount > 0 && (
              <button
                onClick={() => setShowHiddenRecs(!showHiddenRecs)}
                className="chip bg-surface-raised text-ink-muted text-[12px] hover:text-ink transition"
              >
                {showHiddenRecs ? t("analysis.hide_recs") : `${t("analysis.show_recs")} (${hiddenRecsCount})`}
              </button>
            )}
          </div>
        )}

        <ul ref={criteriaListRef} className="divide-y divide-ink/[0.05]">
          {filteredResults.map((r) => {
            const segs = flagsForCriterion(r.criterion_id, r.criterion_name);
            const hasFlags = segs.length > 0;
            const recHidden = isNoChangeRec(r.recommendation) && !showHiddenRecs;
            return (
              <li key={r.id} data-result-id={r.id} className="px-6 py-6 hover:bg-surface-sunken/40 transition scroll-mt-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-[17px] leading-snug mb-2">{r.criterion_name}</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <RiskBadge level={r.risk_level} />
                      {hasFlags && (
                        <button
                          onClick={() => jumpAllToText(r.criterion_id, r.criterion_name)}
                          className="chip bg-accent-50 text-accent-700 text-[11px] hover:bg-accent-100 transition"
                        >
                          <Search size={10} /> {t("analysis.find_in_text")} ({segs.length})
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[22px] font-serif tabular-nums leading-none">
                      {normalizeScore(Number(r.score || 0), r.risk_level).toFixed(1)}
                    </div>
                    <div className="text-[11px] text-ink-muted mt-0.5">/ {scoreMax}</div>
                  </div>
                </div>

                {r.finding && (
                  <div className="text-[14px] text-ink leading-relaxed mt-2">
                    <span className="text-ink-muted text-[12.5px] uppercase tracking-wide mr-2">{t("analysis.found")}</span>
                    {r.finding}
                  </div>
                )}

                {hasFlags && (
                  <div className="mt-4 space-y-2.5">
                    <div className="text-[12px] uppercase tracking-wide text-ink-muted">
                      {t("analysis.evidence")} · {segs.length}
                    </div>
                    {segs.slice(0, 5).map((seg) => {
                      const color = RISK_COLOR[seg.risk_level || "Low"] || RISK_COLOR.Low;
                      return (
                        <button
                          key={seg.id}
                          onClick={() => jumpSegmentToText(seg)}
                          className="block w-full text-left bg-surface-sunken/40 hover:bg-surface-sunken rounded-xl px-4 py-3 transition group"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="h-1.5 w-1.5 rounded-full mt-2 shrink-0" style={{ background: color }} />
                            <div className="flex-1 min-w-0">
                              <blockquote
                                className="text-[13.5px] text-ink italic leading-relaxed border-l-2 pl-3"
                                style={{ borderColor: color }}
                              >
                                «{seg.quote}»
                              </blockquote>
                              {seg.explanation && (
                                <div className="text-[12.5px] text-ink-muted mt-1.5 pl-3">
                                  {seg.explanation}
                                </div>
                              )}
                            </div>
                            <Search size={13} className="text-ink-subtle group-hover:text-accent shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })}
                    {segs.length > 5 && (
                      <div className="text-[12px] text-ink-muted text-center pt-1">
                        +{segs.length - 5} {t("analysis.more_evidence")}
                      </div>
                    )}
                  </div>
                )}

                {r.recommendation && !recHidden && (
                  <div className="text-[14px] text-ink-muted leading-relaxed mt-4 bg-accent-50/40 rounded-xl px-4 py-3">
                    <span className="text-accent text-[12.5px] uppercase tracking-wide mr-2 font-medium">{t("analysis.recommendation")}</span>
                    {r.recommendation}
                  </div>
                )}
              </li>
            );
          })}
          {filteredResults.length === 0 && (
            <li className="px-6 py-10 text-center text-ink-muted text-sm">{t("common.empty")}</li>
          )}
        </ul>
      </div>

      {docQ.data?.extracted_text && (
        <div ref={textRef}>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-xl">{t("analysis.text_highlighted")}</h2>
            <span className="text-[12px] text-ink-muted">{t("analysis.click_segment")}</span>
          </div>
          <HighlightedText
            text={docQ.data.extracted_text}
            segments={a.flagged || []}
            activeIds={activeCriterionSegIds}
          />
        </div>
      )}
    </div>
  );
}
