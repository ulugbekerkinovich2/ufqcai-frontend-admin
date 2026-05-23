import { useState, useMemo, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/api/client";
import type { Analysis, Document, RiskLevel, FlaggedSegment } from "@/types";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { HighlightedText } from "@/components/shared/HighlightedText";
import { AnalysisProgress } from "@/components/shared/AnalysisProgress";
import { Download, ArrowLeft, AlertTriangle, Filter, Search } from "lucide-react";
import { useAuth } from "@/store/auth";
import {
  PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

const RISK_COLOR: Record<string, string> = {
  None: "#9CA3AF", Low: "#D97706", Medium: "#EA580C", High: "#DC2626",
};
const RISK_RANK: Record<string, number> = { None: 0, Low: 1, Medium: 2, High: 3 };

function shorten(name: string, n = 14): string {
  // "1. Nom" → "Nom" — raqamni olib tashlash, qisqartirish
  const clean = name.replace(/^\s*\d+[.)]\s*/, "");
  return clean.length > n ? clean.slice(0, n - 1) + "…" : clean;
}

export function AnalysisResult() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [filter, setFilter] = useState<"all" | "high" | "flagged">("all");
  const [sort, setSort] = useState<"score" | "risk">("risk");
  const [activeSegment, setActiveSegment] = useState<FlaggedSegment | null>(null);
  const [showLow, setShowLow] = useState(false);
  const [showHiddenRecs, setShowHiddenRecs] = useState(false);
  const textRef = useRef<HTMLDivElement | null>(null);

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

  // ScrollIntoView segment'ga
  useEffect(() => {
    if (!activeSegment || !textRef.current) return;
    const el = textRef.current.querySelector<HTMLElement>(`[data-seg-id="${activeSegment.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSegment]);

  if (!aQ.data) return <div className="text-ink-muted">{t("common.loading")}</div>;
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
  // overall_score uchun ham normalize
  const overallScale = score > 10 ? 100 : 10;
  const scorePct = (score / overallScale) * 100;

  // Radar — toza, faqat name + score (0-100% normalized)
  const radarData = results.map((r) => ({
    name: shorten(r.criterion_name || ""),
    fullName: r.criterion_name,
    raw: Number(r.score || 0),
    score: (Number(r.score || 0) / scoreMax) * 100,
    risk: r.risk_level as RiskLevel,
  }));

  const riskCounts = (["None", "Low", "Medium", "High"] as RiskLevel[]).map((lvl) => ({
    risk: lvl, count: results.filter((r) => r.risk_level === lvl).length,
  }));

  async function downloadPdf() {
    const res = await fetch(`${API_BASE_URL}/analyses/${id}/report`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tahlil-${id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function jumpToCriterion(criterionId?: string | null, criterionName?: string | null) {
    const segs = flagsForCriterion(criterionId, criterionName);
    if (segs.length > 0) {
      // Eng yuqori riskli birinchi
      const best = [...segs].sort((a, b) => (RISK_RANK[b.risk_level || "None"] || 0) - (RISK_RANK[a.risk_level || "None"] || 0))[0];
      setActiveSegment(best);
    }
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
            <div className="flex items-center gap-3 mb-4">
              <RiskBadge level={a.overall_risk} />
              <span className="text-[12.5px] text-ink-subtle">
                {t("analysis.summary")} · {score.toFixed(1)} / {overallScale}
              </span>
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
              <span className="text-[12px] text-ink-muted">{results.length} · 0–{scoreMax}</span>
            </div>
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {[...results].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).map((r) => {
                const sc = Number(r.score || 0);
                const pct = Math.max(2, (sc / scoreMax) * 100);
                const color = RISK_COLOR[r.risk_level] || RISK_COLOR.None;
                const hasFlags = flagsForCriterion(r.criterion_id, r.criterion_name).length > 0;
                return (
                  <button
                    key={r.id}
                    onClick={() => jumpToCriterion(r.criterion_id, r.criterion_name)}
                    className="w-full text-left group hover:bg-surface-sunken/40 rounded-lg px-2 py-1.5 -mx-2 transition"
                    title={hasFlags ? "Matn ichidan topish" : ""}
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

          <div className="card p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-serif text-lg">{t("analysis.radar")}</h3>
              <span className="text-[12px] text-ink-muted">Top {Math.min(12, results.length)}</span>
            </div>
            {/* Radar — faqat top-12 eng yuqori ballik, overlap kamayadi */}
            <div className="h-[400px]">
              <ResponsiveContainer>
                <RadarChart
                  data={[...radarData].sort((a, b) => b.raw - a.raw).slice(0, 12)}
                  margin={{ top: 16, right: 30, left: 30, bottom: 8 }}
                  outerRadius="78%"
                >
                  <PolarGrid stroke="#E5E5E1" strokeDasharray="2 4" />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{ fill: "#4B5563", fontSize: 11 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#0F766E"
                    strokeWidth={2}
                    fill="#0F766E"
                    fillOpacity={0.22}
                    dot={{ fill: "#0F766E", r: 3 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(16,24,40,0.12)", fontSize: 13, padding: "8px 12px" }}
                    formatter={(_v: any, _n: any, p: any) => [
                      `${p.payload.raw.toFixed(1)} / ${scoreMax}`,
                      p.payload.fullName,
                    ]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
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

        {/* Criterion cards */}
        <div className="p-5 space-y-4">
          {filteredResults.map((r) => {
            const segs = flagsForCriterion(r.criterion_id, r.criterion_name);
            const hasFlags = segs.length > 0;
            const recHidden = isNoChangeRec(r.recommendation) && !showHiddenRecs;
            const borderColor = RISK_COLOR[r.risk_level] || RISK_COLOR.None;
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-ink/[0.08] overflow-hidden"
                style={{ borderLeftColor: borderColor, borderLeftWidth: 3 }}
              >
                {/* Card header */}
                <div className="px-5 py-4">
                  <h4 className="font-serif text-[17px] leading-snug mb-2.5">{r.criterion_name}</h4>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <RiskBadge level={r.risk_level} />
                    <span className="text-[12px] text-ink-muted tabular-nums">
                      {t("analysis.score")}: {r.score?.toString()} / {scoreMax}
                    </span>
                    {hasFlags && (
                      <button
                        onClick={() => jumpToCriterion(r.criterion_id, r.criterion_name)}
                        className="chip bg-accent-50 text-accent-700 text-[11px] hover:bg-accent-100 transition"
                      >
                        <Search size={10} /> {t("analysis.find_in_text")} ({segs.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Finding */}
                {r.finding && (
                  <div className="px-5 py-3.5 border-t border-ink/[0.06] bg-surface-sunken/20">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted mb-1.5 font-medium">
                      {t("analysis.found")}
                    </div>
                    <p className="text-[14px] text-ink leading-relaxed">{r.finding}</p>
                  </div>
                )}

                {/* Evidence */}
                {hasFlags && (
                  <div className="px-5 py-3.5 border-t border-ink/[0.06]">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted mb-2.5 font-medium">
                      {t("analysis.evidence")} · {segs.length}
                    </div>
                    <div className="space-y-2">
                      {segs.slice(0, 5).map((seg) => {
                        const color = RISK_COLOR[seg.risk_level || "Low"] || RISK_COLOR.Low;
                        return (
                          <button
                            key={seg.id}
                            onClick={() => setActiveSegment(seg)}
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
                  </div>
                )}

                {/* Recommendation */}
                {r.recommendation && !recHidden && (
                  <div className="px-5 py-3.5 border-t border-ink/[0.06] bg-accent-50/20">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-accent mb-1.5 font-medium">
                      {t("analysis.recommendation")}
                    </div>
                    <p className="text-[14px] text-ink-muted leading-relaxed">{r.recommendation}</p>
                  </div>
                )}
              </div>
            );
          })}
          {filteredResults.length === 0 && (
            <div className="py-10 text-center text-ink-muted text-sm">{t("common.empty")}</div>
          )}
        </div>
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
            activeId={activeSegment?.id}
          />
        </div>
      )}
    </div>
  );
}
