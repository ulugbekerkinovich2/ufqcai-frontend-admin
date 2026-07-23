import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { Document } from "@/types";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { ArrowUpRight, FileText, ShieldCheck, Activity, Film } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Skeleton, TableSkeleton } from "@/components/shared/Skeleton";


export function Dashboard() {
  const { t } = useI18n();
  const docsQ = useQuery({
    queryKey: ["dash-docs"],
    queryFn: async () => (await api.get<Document[]>("/documents", { params: { limit: 30 } })).data,
  });
  const statsQ = useQuery({
    queryKey: ["dash-stats"],
    queryFn: async () => (await api.get<{
      total_documents: number;
      analyses_in_progress: number;
      analyses_completed: number;
      avg_score: number;
      by_risk: { risk: string; count: number }[];
      top_genres: { genre: string; count: number }[];
    }>("/analyses-stats")).data,
  });

  const items = docsQ.data || [];
  const s = statsQ.data;
  const loading = docsQ.isLoading || statsQ.isLoading;

  // So'nggi 7 kun trendi — haqiqiy yuklash sanasiga ko'ra
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toLocaleDateString(undefined, { weekday: "short" });
    return { day, count: items.filter((it) => new Date(it.created_at).toDateString() === d.toDateString()).length };
  });

  const stats = [
    { label: t("dashboard.total_scenarios"), value: s?.total_documents ?? items.length, icon: FileText },
    { label: t("dashboard.analyzing"), value: s?.analyses_in_progress ?? 0, icon: Activity },
    { label: t("dashboard.completed"), value: s?.analyses_completed ?? 0, icon: ShieldCheck },
  ];

  const topGenres = s?.top_genres || [];

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("dashboard.overview")}</p>
          <h1 className="font-serif text-[26px] leading-tight">{t("dashboard.title")}</h1>
        </div>
        <Link to="/documents" className="btn-secondary">
          {t("dashboard.new_script")} <ArrowUpRight size={15} />
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[12.5px] text-ink-muted">{stat.label}</div>
              <div className="h-8 w-8 rounded-xl bg-accent-50 text-accent grid place-items-center">
                <stat.icon size={15} strokeWidth={1.75} />
              </div>
            </div>
            {loading ? <Skeleton className="h-9 w-16" /> : (
              <div className="font-serif text-[34px] leading-none tabular-nums">{stat.value}</div>
            )}
          </div>
        ))}

        {/* Genre card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[12.5px] text-ink-muted">{t("analysis.genre")}</div>
            <div className="h-8 w-8 rounded-xl bg-accent-50 text-accent grid place-items-center">
              <Film size={15} strokeWidth={1.75} />
            </div>
          </div>
          {loading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ) : topGenres.length > 0 ? (
            <div className="space-y-2">
              {topGenres.slice(0, 4).map((g) => (
                <div key={g.genre} className="flex items-center gap-2">
                  <span className="text-[13px] text-ink truncate flex-1">{g.genre}</span>
                  <span className="text-[13px] font-mono tabular-nums text-ink-muted shrink-0">{g.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12.5px] text-ink-subtle mt-1">{t("analysis.genre_empty")}</div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-lg">{t("dashboard.trend")}</h2>
          <span className="text-[12px] text-ink-muted">{t("dashboard.last7")}</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={trend} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gAccent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E4D8C" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#1E4D8C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#EEEEEA" vertical={false} />
              <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(16,24,40,0.12)", fontSize: 13 }}
              />
              <Area type="monotone" dataKey="count" stroke="#1E4D8C" strokeWidth={2} fill="url(#gAccent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="font-serif text-lg">{t("dashboard.recent")}</h2>
          <Link to="/documents" className="text-[13px] text-accent hover:text-accent-700 inline-flex items-center gap-1">
            {t("dashboard.all")} <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="surface-divider overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                <th className="text-left font-medium px-6 py-3">{t("documents.col_name")}</th>
                <th className="text-left font-medium py-3">{t("documents.col_status")}</th>
                <th className="text-left font-medium py-3">{t("documents.col_date")}</th>
                <th></th>
              </tr>
            </thead>
            {docsQ.isLoading ? <TableSkeleton rows={4} cols={4} /> : <tbody>
              {items.slice(0, 6).map((d) => (
                <tr key={d.id} className="table-row border-t border-ink/[0.05] hover:bg-surface-sunken/50">
                  <td className="px-6 text-[14px] text-ink">
                    <Link to={`/documents/${d.id}`} className="font-medium hover:text-accent">{d.title}</Link>
                    <div className="text-[12px] text-ink-subtle">{d.original_name}</div>
                  </td>
                  <td>
                    <span className="chip bg-surface-sunken text-ink-muted">{t(`status.${d.status}`)}</span>
                  </td>
                  <td className="text-[13px] text-ink-muted">{formatDate(d.created_at)}</td>
                  <td className="pr-6 text-right">
                    <Link to={`/documents/${d.id}`} className="text-ink-muted hover:text-accent">
                      <ArrowUpRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-ink-muted text-sm">{t("common.empty")}</td></tr>
              )}
            </tbody>}
          </table>
        </div>
      </div>
    </div>
  );
}
