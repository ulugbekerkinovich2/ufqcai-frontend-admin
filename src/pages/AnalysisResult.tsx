import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/api/client";
import type { Analysis, Document, RiskLevel } from "@/types";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { HighlightedText } from "@/components/shared/HighlightedText";
import { AnalysisProgress } from "@/components/shared/AnalysisProgress";
import { Download, ArrowLeft, AlertTriangle, Filter } from "lucide-react";
import { useAuth } from "@/store/auth";
import {
  PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

const RISK_COLOR: Record<string, string> = {
  None: "#9CA3AF", Low: "#D97706", Medium: "#EA580C", High: "#DC2626",
};
const RISK_RANK: Record<string, number> = { None: 0, Low: 1, Medium: 2, High: 3 };

function shorten(name: string, n = 22): string {
  return name.length > n ? name.slice(0, n - 1) + "…" : name;
}

export function AnalysisResult() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();

  // ----- Hooks: barchasi early-return'dan oldin -----
  const [filter, setFilter] = useState<"all" | "high" | "flagged">("all");
  const [sort, setSort] = useState<"score" | "risk">("risk");

  const aQ = useQuery({
    queryKey: ["analysis", id],
    queryFn: async () => (await api.get<Analysis>(`/analyses/${id}`)).data,
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

  const filteredResults = useMemo(() => {
    let arr = [...results];
    if (filter === "high") arr = arr.filter((r) => r.risk_level === "High");
    if (filter === "flagged") arr = arr.filter((r) => flagged.some((f) => f.criterion_id === r.criterion_id));
    if (sort === "score") arr.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    if (sort === "risk") arr.sort((a, b) => (RISK_RANK[b.risk_level] - RISK_RANK[a.risk_level]) || (Number(b.score || 0) - Number(a.score || 0)));
    return arr;
  }, [results, flagged, filter, sort]);

  // ----- Render guards -----
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
  const radarData = results.map((r) => ({
    name: shorten(r.criterion_name || "", 14),
    fullName: r.criterion_name,
    score: Number(r.score || 0) * 10,  // backend 0-10 → 0-100 scale
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
          <ScoreGauge value={score} />
          <div>
            <div className="flex items-center gap-3 mb-4">
              <RiskBadge level={a.overall_risk} />
              <span className="text-[12.5px] text-ink-subtle">{t("analysis.summary")}</span>
            </div>
            <p className="text-[15px] leading-relaxed text-ink text-pretty">{a.summary}</p>
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
              <span className="text-[12px] text-ink-muted">{results.length}</span>
            </div>
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {[...results].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).map((r) => {
                const sc = Number(r.score || 0);
                const pct = Math.max(2, sc * 10);  // 0-10 ball → 0-100% width
                const color = RISK_COLOR[r.risk_level] || RISK_COLOR.None;
                return (
                  <div key={r.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] text-ink truncate flex-1">{r.criterion_name}</span>
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
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-serif text-lg">{t("analysis.radar")}</h3>
              <span className="text-[12px] text-ink-muted">{results.length}</span>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer>
                <RadarChart data={radarData} margin={{ top: 16, right: 30, left: 30, bottom: 8 }}>
                  <PolarGrid stroke="#E5E5E1" strokeDasharray="2 4" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: "#4B5563", fontSize: 11 }} />
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
                    formatter={(v: any, _n: any, p: any) => [`${(Number(v) / 10).toFixed(1)} / 10`, p.payload.fullName]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 py-5 flex flex-wrap items-center gap-4 justify-between">
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
        <ul className="surface-divider divide-y divide-ink/[0.05]">
          {filteredResults.map((r) => (
            <li key={r.id} className="px-6 py-5 hover:bg-surface-sunken/40 transition">
              <div className="flex flex-wrap items-baseline gap-3 mb-2">
                <h4 className="font-serif text-[17px]">{r.criterion_name}</h4>
                <RiskBadge level={r.risk_level} />
                <span className="text-[12px] text-ink-muted ml-auto tabular-nums">{t("analysis.score")}: {r.score?.toString()}</span>
              </div>
              {r.finding && (
                <div className="text-[14px] text-ink leading-relaxed mt-2">
                  <span className="text-ink-muted text-[12.5px] uppercase tracking-wide mr-2">{t("analysis.found")}</span>
                  {r.finding}
                </div>
              )}
              {r.recommendation && (
                <div className="text-[14px] text-ink-muted leading-relaxed mt-2">
                  <span className="text-accent text-[12.5px] uppercase tracking-wide mr-2">{t("analysis.recommendation")}</span>
                  {r.recommendation}
                </div>
              )}
            </li>
          ))}
          {filteredResults.length === 0 && (
            <li className="px-6 py-10 text-center text-ink-muted text-sm">{t("common.empty")}</li>
          )}
        </ul>
      </div>

      {docQ.data?.extracted_text && (
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-xl">{t("analysis.text_highlighted")}</h2>
            <span className="text-[12px] text-ink-muted">{t("analysis.click_segment")}</span>
          </div>
          <HighlightedText text={docQ.data.extracted_text} segments={a.flagged || []} />
        </div>
      )}
    </div>
  );
}
