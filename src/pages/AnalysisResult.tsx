import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Analysis, Document, RiskLevel } from "@/types";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { HighlightedText } from "@/components/shared/HighlightedText";
import { Download } from "lucide-react";
import { useAuth } from "@/store/auth";
import { Bar, BarChart, CartesianGrid, Cell, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const RISK_COLOR: Record<string, string> = {
  None: "#6b7280", Low: "#eab308", Medium: "#ea580c", High: "#dc2626",
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
      return s === "completed" || s === "failed" ? false : 2000;
    },
  });

  const docQ = useQuery({
    queryKey: ["doc-for-analysis", aQ.data?.document_id],
    queryFn: async () => (await api.get<Document>(`/documents/${aQ.data!.document_id}`)).data,
    enabled: !!aQ.data?.document_id,
  });

  if (!aQ.data) return <div>Yuklanmoqda...</div>;
  const a = aQ.data;

  if (a.status === "pending" || a.status === "running") {
    return (
      <div className="bg-white p-10 rounded border text-center">
        <div className="animate-pulse text-lg font-medium">Tahlil bajarilmoqda...</div>
        <div className="text-sm text-gray-500 mt-2">Status: {a.status}</div>
      </div>
    );
  }
  if (a.status === "failed") {
    return <div className="bg-red-50 border border-red-300 p-6 rounded text-red-700">
      Xatolik: {a.error_message}
    </div>;
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
    risk: lvl,
    count: results.filter((r) => r.risk_level === lvl).length,
  }));

  async function downloadPdf() {
    const res = await fetch(`/api/v1/analyses/${id}/report`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analysis-${id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Tahlil natijasi</h1>
          <div className="text-sm text-gray-500">{docQ.data?.title}</div>
        </div>
        <button onClick={downloadPdf} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">
          <Download size={16} /> PDF
        </button>
      </div>

      <div className="bg-white p-6 rounded border flex items-center gap-6">
        <ScoreGauge value={score} />
        <div className="flex-1">
          <div className="mb-2"><RiskBadge level={a.overall_risk} /></div>
          <p className="text-gray-700">{a.summary}</p>
          <div className="text-xs text-gray-500 mt-3">
            Model: {a.model_used} · Tokenlar: {a.tokens_used}
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-2">Kriteriyalar bo'yicha ballar</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={60} fontSize={11} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(v: any, _n, p: any) => [`${v}`, p.payload.fullName]} />
                  <Bar dataKey="score">
                    {chartData.map((d, i) => <Cell key={i} fill={RISK_COLOR[d.risk] || "#6b7280"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-2">Risk profili (radar)</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <RadarChart data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" fontSize={11} />
                  <PolarRadiusAxis domain={[0, 100]} angle={90} />
                  <Radar name="Ball" dataKey="score" stroke="#1e6091" fill="#1e6091" fillOpacity={0.35} />
                  <Tooltip formatter={(v: any, _n, p: any) => [`${v}`, p.payload.fullName]} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 rounded border lg:col-span-2">
            <h3 className="font-semibold mb-2">Risk darajalari taqsimoti</h3>
            <div className="h-40">
              <ResponsiveContainer>
                <BarChart data={riskCounts} layout="vertical">
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="risk" width={80} />
                  <Tooltip />
                  <Bar dataKey="count">
                    {riskCounts.map((d, i) => <Cell key={i} fill={RISK_COLOR[d.risk]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded border">
        <div className="px-4 py-3 border-b font-semibold">Kriteriyalar bo'yicha natija</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Kriteriya</th><th>Risk</th><th>Ball</th><th>Aniqlangan holat</th><th>Tavsiya</th></tr>
          </thead>
          <tbody>
            {(a.results || []).map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3 font-medium">{r.criterion_name}</td>
                <td className="p-3"><RiskBadge level={r.risk_level} /></td>
                <td className="p-3">{r.score?.toString()}</td>
                <td className="p-3">{r.finding}</td>
                <td className="p-3">{r.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {docQ.data?.extracted_text && (
        <div>
          <h2 className="font-semibold mb-2">Ssenariy matni (belgilangan parchalar bilan)</h2>
          <HighlightedText text={docQ.data.extracted_text} segments={a.flagged || []} />
        </div>
      )}
    </div>
  );
}
