import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DollarSign, Cpu, Activity, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Skeleton, TableSkeleton } from "@/components/shared/Skeleton";

interface Summary {
  total: { analyses: number; generations: number; tokens: number; cost_usd: number };
  today: { tokens: number; cost_usd: number };
  month: { tokens: number; cost_usd: number };
  by_model: { model: string; tokens: number; cost_usd: number; count: number }[];
}

interface UserRow {
  user_id?: string;
  full_name?: string;
  email?: string;
  tokens: number;
  analyses: number;
  cost_usd: number;
}

interface DailyRow {
  date: string;
  tokens: number;
  count: number;
  cost_usd: number;
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n || 0);
}

function fmtInt(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n || 0);
}

export function Usage() {
  const { t } = useI18n();
  const sumQ = useQuery({ queryKey: ["usage-summary"], queryFn: async () => (await api.get<Summary>("/usage/summary")).data });
  const byUserQ = useQuery({ queryKey: ["usage-by-user"], queryFn: async () => (await api.get<UserRow[]>("/usage/by-user")).data });
  const dailyQ = useQuery({ queryKey: ["usage-daily"], queryFn: async () => (await api.get<DailyRow[]>("/usage/daily", { params: { days: 30 } })).data });

  const s = sumQ.data;
  const users = byUserQ.data || [];
  const daily = dailyQ.data || [];

  return (
    <div className="space-y-7 animate-fade-in">
      <header>
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("usage.section")}</p>
        <h1 className="font-serif text-[26px] leading-tight">{t("usage.title")}</h1>
        <p className="text-[13.5px] text-ink-muted mt-2 max-w-2xl">{t("usage.hint")}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard loading={sumQ.isLoading} icon={DollarSign} label={t("usage.total_cost")} value={fmtUSD(s?.total.cost_usd || 0)} sub={`${fmtInt(s?.total.tokens || 0)} token`} />
        <StatCard loading={sumQ.isLoading} icon={TrendingUp} label={t("common.today")} value={fmtUSD(s?.today.cost_usd || 0)} sub={`${fmtInt(s?.today.tokens || 0)} token`} />
        <StatCard loading={sumQ.isLoading} icon={Activity} label={t("common.month")} value={fmtUSD(s?.month.cost_usd || 0)} sub={`${fmtInt(s?.month.tokens || 0)} token`} />
        <StatCard loading={sumQ.isLoading} icon={Cpu} label={t("usage.analyses")} value={fmtInt(s?.total.analyses || 0)} sub={`+${fmtInt(s?.total.generations || 0)} ${t("usage.generations")}`} />
      </div>

      <div className="card p-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-lg">{t("usage.last30")}</h2>
          <span className="text-[12px] text-ink-muted">USD</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={daily} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F766E" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#0F766E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#EEEEEA" vertical={false} />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false}
                     tickFormatter={(d) => d?.slice(5)} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false}
                     tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(16,24,40,0.12)", fontSize: 13 }}
                formatter={(v: any, k) => k === "cost_usd" ? [`$${Number(v).toFixed(4)}`, "Xarajat"] : [v, k]}
              />
              <Area type="monotone" dataKey="cost_usd" stroke="#0F766E" strokeWidth={2} fill="url(#gUsage)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="px-6 py-5 flex items-baseline justify-between">
            <h2 className="font-serif text-lg">{t("usage.by_model")}</h2>
            <span className="text-[12px] text-ink-muted">{(s?.by_model || []).length}</span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                <th className="text-left font-medium px-6 py-3">{t("analysis.model")}</th>
                <th className="text-right font-medium py-3">{t("usage.analyses")}</th>
                <th className="text-right font-medium py-3">{t("analysis.tokens")}</th>
                <th className="text-right font-medium py-3 pr-6">{t("usage.total_cost")}</th>
              </tr>
            </thead>
            {sumQ.isLoading ? <TableSkeleton rows={3} cols={4} /> : <tbody>
              {(s?.by_model || []).map((m) => (
                <tr key={m.model} className="border-t border-ink/[0.05]">
                  <td className="px-6 py-3 font-mono text-[12.5px]">{m.model}</td>
                  <td className="text-right tabular-nums">{fmtInt(m.count)}</td>
                  <td className="text-right tabular-nums">{fmtInt(m.tokens)}</td>
                  <td className="text-right tabular-nums pr-6 font-medium">{fmtUSD(m.cost_usd)}</td>
                </tr>
              ))}
              {(!s?.by_model || s.by_model.length === 0) && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-muted">{t("common.empty")}</td></tr>
              )}
            </tbody>}
          </table>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-lg">{t("usage.by_user")}</h2>
            <span className="text-[12px] text-ink-muted">Top {Math.min(users.length, 10)}</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={users.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tickFormatter={(v) => `$${Number(v).toFixed(2)}`} stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="full_name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} width={130} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(16,24,40,0.12)", fontSize: 13 }}
                  formatter={(v: any, k) => k === "cost_usd" ? [`$${Number(v).toFixed(4)}`, "Xarajat"] : [v, k]}
                />
                <Bar dataKey="cost_usd" radius={[0, 6, 6, 0]}>
                  {users.slice(0, 10).map((_, i) => <Cell key={i} fill="#0F766E" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-5">
          <h2 className="font-serif text-lg">{t("usage.by_user")}</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
              <th className="text-left font-medium px-6 py-3">{t("users.title")}</th>
              <th className="text-right font-medium py-3">{t("usage.analyses")}</th>
              <th className="text-right font-medium py-3">{t("analysis.tokens")}</th>
              <th className="text-right font-medium py-3 pr-6">{t("usage.total_cost")}</th>
            </tr>
          </thead>
          {byUserQ.isLoading ? <TableSkeleton rows={3} cols={4} /> : <tbody>
            {users.map((u) => (
              <tr key={u.user_id || u.email} className="border-t border-ink/[0.05]">
                <td className="px-6 py-3">
                  <div className="font-medium text-ink">{u.full_name || "—"}</div>
                  <div className="text-[12px] text-ink-muted">{u.email || ""}</div>
                </td>
                <td className="text-right tabular-nums">{fmtInt(u.analyses)}</td>
                <td className="text-right tabular-nums">{fmtInt(u.tokens)}</td>
                <td className="text-right tabular-nums pr-6 font-medium">{fmtUSD(u.cost_usd)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-muted">{t("common.empty")}</td></tr>
            )}
          </tbody>}
        </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, loading }: { icon: any; label: string; value: string; sub: string; loading?: boolean }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="text-[12.5px] text-ink-muted">{label}</div>
        <div className="h-8 w-8 rounded-xl bg-accent-50 text-accent grid place-items-center">
          <Icon size={15} strokeWidth={1.75} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="font-serif text-[28px] leading-none tabular-nums text-ink">{value}</div>
      )}
      <div className="text-[12px] text-ink-subtle mt-2">{sub}</div>
    </div>
  );
}
