import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/api/client";
import type { Analysis, Document, RiskLevel } from "@/types";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { HighlightedText } from "@/components/shared/HighlightedText";
import { Download, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/store/auth";
import {
  Bar, BarChart, Cell, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const RISK_COLOR: Record<string, string> = {
  None: "#9CA3AF", Low: "#D97706", Medium: "#EA580C", High: "#DC2626",
};

function shorten(name: string, n = 18): string {
  return name.length > n ? name.slice(0, n - 1) + "…" : name;
}

export function AnalysisResult() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();

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

  if (!aQ.data) return <div className="text-ink-muted">Yuklanmoqda...</div>;
  const a = aQ.data;

  if (a.status === "pending" || a.status === "running") {
    return (
      <div className="card p-16 text-center animate-fade-in">
        <div className="mx-auto h-12 w-12 rounded-full bg-accent-50 text-accent grid place-items-center mb-4">
          <Loader2 size={20} className="animate-spin" />
        </div>
        <div className="font-serif text-xl mb-1.5">Tahlil bajarilmoqda</div>
        <p className="text-sm text-ink-muted">Sun'iy idrok ssenariyni mezonlar va qonunlar bo'yicha o'rganmoqda. Bu odatda 60–120 soniya davom etadi.</p>
      </div>
    );
  }
  if (a.status === "failed") {
    return (
      <div className="card p-8 border border-risk-high-bg animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-risk-high-bg text-risk-high-fg grid place-items-center">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-lg mb-1.5">Tahlil yakunlanmadi</h2>
            <p className="text-sm text-ink-muted">{a.error_message}</p>
          </div>
        </div>
      </div>
    );
  }

  const score = Number(a.overall_score || 0);
  const results = a.results || [];
  const chartData = results.map((r) => ({
    name: shorten(r.criterion_name || ""),
    fullName: r.criterion_name,
    score: Number(r.score || 0),
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
        <ArrowLeft size={14} /> Ssenariyga qaytish
      </Link>

      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">Tahlil natijasi</p>
          <h1 className="font-serif text-[24px] leading-tight text-balance">{docQ.data?.title}</h1>
          <div className="text-[12px] text-ink-subtle mt-2 tabular-nums">
            Model: {a.model_used} · Tokenlar: {a.tokens_used?.toLocaleString("uz-UZ")}
          </div>
        </div>
        <button onClick={downloadPdf} className="btn-primary shrink-0">
          <Download size={15} strokeWidth={2} /> PDF eksport
        </button>
      </header>

      <div className="card p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-8 items-center">
          <ScoreGauge value={score} />
          <div>
            <div className="flex items-center gap-3 mb-4">
              <RiskBadge level={a.overall_risk} />
              <span className="text-[12.5px] text-ink-subtle">Umumiy xulosa</span>
            </div>
            <p className="text-[15px] leading-relaxed text-ink text-pretty">{a.summary}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:min-w-[170px]">
            {riskCounts.map((r) => (
              <div key={r.risk} className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLOR[r.risk] }} />
                <span className="text-[12.5px] text-ink-muted flex-1">
                  {r.risk === "None" ? "Yo'q" : r.risk === "Low" ? "Past" : r.risk === "Medium" ? "O'rta" : "Yuqori"}
                </span>
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
              <h3 className="font-serif text-lg">Mezonlar bo'yicha ballar</h3>
              <span className="text-[12px] text-ink-muted">{results.length} ta</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={70}
                         stroke="#9CA3AF" fontSize={11.5} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={11.5} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(15,118,110,0.05)" }}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(16,24,40,0.12)", fontSize: 13 }}
                    formatter={(v: any, _n, p: any) => [`${v}`, p.payload.fullName]}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {chartData.map((d, i) => <Cell key={i} fill={RISK_COLOR[d.risk]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-serif text-lg">Risk profili</h3>
              <span className="text-[12px] text-ink-muted">Radar</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#EEEEEA" />
                  <PolarAngleAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                  <PolarRadiusAxis domain={[0, 100]} angle={90} stroke="#D1D5DB" fontSize={10} tickCount={4} />
                  <Radar name="Ball" dataKey="score" stroke="#0F766E" strokeWidth={1.5} fill="#0F766E" fillOpacity={0.18} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(16,24,40,0.12)", fontSize: 13 }}
                    formatter={(v: any, _n, p: any) => [`${v}`, p.payload.fullName]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 py-5 flex items-baseline justify-between">
          <h2 className="font-serif text-lg">Mezonlar bo'yicha tafsilot</h2>
          <span className="text-[12px] text-ink-muted">Tavsiya va asoslar bilan</span>
        </div>
        <ul className="surface-divider divide-y divide-ink/[0.05]">
          {results.map((r) => (
            <li key={r.id} className="px-6 py-5 hover:bg-surface-sunken/40 transition">
              <div className="flex flex-wrap items-baseline gap-3 mb-2">
                <h4 className="font-serif text-[17px]">{r.criterion_name}</h4>
                <RiskBadge level={r.risk_level} />
                <span className="text-[12px] text-ink-muted ml-auto tabular-nums">Ball: {r.score?.toString()}</span>
              </div>
              {r.finding && (
                <div className="text-[14px] text-ink leading-relaxed mt-2">
                  <span className="text-ink-muted text-[12.5px] uppercase tracking-wide mr-2">Aniqlangan</span>
                  {r.finding}
                </div>
              )}
              {r.recommendation && (
                <div className="text-[14px] text-ink-muted leading-relaxed mt-2">
                  <span className="text-accent text-[12.5px] uppercase tracking-wide mr-2">Tavsiya</span>
                  {r.recommendation}
                </div>
              )}
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-6 py-10 text-center text-ink-muted text-sm">Natijalar mavjud emas</li>
          )}
        </ul>
      </div>

      {docQ.data?.extracted_text && (
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-xl">Ssenariy matni</h2>
            <span className="text-[12px] text-ink-muted">Belgilangan parchaga bosing</span>
          </div>
          <HighlightedText text={docQ.data.extracted_text} segments={a.flagged || []} />
        </div>
      )}
    </div>
  );
}
