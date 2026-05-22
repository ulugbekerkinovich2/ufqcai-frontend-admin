import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { Document } from "@/types";
import { Link } from "react-router-dom";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatDate } from "@/lib/utils";
import { ArrowUpRight, FileText, ShieldCheck, Activity, Sparkles } from "lucide-react";

const RISK_COLORS = ["#9CA3AF", "#D97706", "#EA580C", "#DC2626"];

export function Dashboard() {
  const docsQ = useQuery({
    queryKey: ["dash-docs"],
    queryFn: async () => (await api.get<Document[]>("/documents", { params: { limit: 30 } })).data,
  });

  const items = docsQ.data || [];

  // Trend mock (so'nggi 7 kun)
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toLocaleDateString("uz-UZ", { weekday: "short" });
    return { day, count: Math.max(0, items.filter((it) => new Date(it.created_at).toDateString() === d.toDateString()).length) };
  });

  const pieData = [
    { name: "Yo'q", value: 8, color: "#9CA3AF" },
    { name: "Past", value: 5, color: "#D97706" },
    { name: "O'rta", value: 3, color: "#EA580C" },
    { name: "Yuqori", value: 2, color: "#DC2626" },
  ];

  const stats = [
    { label: "Jami ssenariylar", value: items.length, icon: FileText, change: "+12% bu oy" },
    { label: "Tahlilda", value: items.filter((d) => d.status === "analyzing").length, icon: Activity, change: "real vaqt" },
    { label: "O'rtacha ball", value: 74, icon: Sparkles, change: "+3.2 punkt" },
    { label: "Tahlil tugagan", value: items.filter((d) => d.status === "done" || d.status === "parsed").length, icon: ShieldCheck, change: "stabil" },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">Umumiy ko'rinish</p>
          <h1 className="font-serif text-[26px] leading-tight">Boshqaruv paneli</h1>
        </div>
        <Link to="/documents" className="btn-secondary">
          Yangi ssenariy <ArrowUpRight size={15} />
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[12.5px] text-ink-muted">{s.label}</div>
              <div className="h-8 w-8 rounded-xl bg-accent-50 text-accent grid place-items-center">
                <s.icon size={15} strokeWidth={1.75} />
              </div>
            </div>
            <div className="font-serif text-[34px] leading-none tabular-nums">{s.value}</div>
            <div className="text-[12px] text-ink-subtle mt-2">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-serif text-lg">Tahlil dinamikasi</h2>
            <span className="text-[12px] text-ink-muted">So'nggi 7 kun</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAccent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F766E" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#0F766E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEEEEA" vertical={false} />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(16,24,40,0.12)", fontSize: 13 }}
                />
                <Area type="monotone" dataKey="count" stroke="#0F766E" strokeWidth={2} fill="url(#gAccent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-serif text-lg">Risk taqsimoti</h2>
            <span className="text-[12px] text-ink-muted">Hozirgi holat</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={42} outerRadius={68} strokeWidth={0} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(16,24,40,0.12)", fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[12.5px]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLORS[i] }} />
                <span className="text-ink-muted">{d.name}</span>
                <span className="ml-auto tabular-nums text-ink">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="font-serif text-lg">So'nggi ssenariylar</h2>
          <Link to="/documents" className="text-[13px] text-accent hover:text-accent-700 inline-flex items-center gap-1">
            Hammasi <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="surface-divider">
          <table className="w-full">
            <thead>
              <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                <th className="text-left font-medium px-6 py-3">Nomi</th>
                <th className="text-left font-medium py-3">Status</th>
                <th className="text-left font-medium py-3">Sana</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 6).map((d) => (
                <tr key={d.id} className="table-row border-t border-ink/[0.05] hover:bg-surface-sunken/50">
                  <td className="px-6 text-[14px] text-ink">
                    <Link to={`/documents/${d.id}`} className="font-medium hover:text-accent">{d.title}</Link>
                    <div className="text-[12px] text-ink-subtle">{d.original_name}</div>
                  </td>
                  <td>
                    <span className="chip bg-surface-sunken text-ink-muted">{d.status}</span>
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
                <tr><td colSpan={4} className="px-6 py-10 text-center text-ink-muted text-sm">Hozircha ssenariy yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
