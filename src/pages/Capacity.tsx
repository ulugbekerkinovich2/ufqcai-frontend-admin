import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import {
  Cpu, HardDrive, MemoryStick, Wifi, Users, Zap, Database,
  AlertTriangle, CheckCircle, Activity, Server, TrendingUp,
  RefreshCw, FlaskConical, CircleDot,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useI18n } from "@/lib/i18n";

interface SystemMetrics {
  cpu_percent: number; ram_percent: number;
  ram_used_gb: number; ram_total_gb: number;
  disk_percent: number; disk_used_gb: number; disk_total_gb: number;
  net_sent_mb: number; net_recv_mb: number; psutil_missing?: boolean;
}
interface RedisMetrics { connected_clients: number; ops_per_sec: number; memory_mb: number; queue_length: number; }
interface DbMetrics {
  total_users: number; total_documents: number;
  active_users_1h: number; active_users_24h: number;
  analyses_1h: number; analyses_24h: number;
  running_analyses: number; error_rate_percent: number;
}
interface AiMetrics {
  tokens_1h: number; tokens_24h: number;
  avg_tokens_per_analysis: number; avg_analysis_duration_sec: number;
}
interface CapacityEstimate {
  load_percent: number; estimated_max_users: number;
  current_active_users: number; remaining_capacity: number;
  risk: "Low" | "Medium" | "High"; bottlenecks: string[];
  cpu_headroom: number; ram_headroom: number;
}
interface Snapshot {
  ts: string; system: SystemMetrics; redis: RedisMetrics;
  db: DbMetrics; ai: AiMetrics; capacity: CapacityEstimate;
}
interface HistoryPoint { hour: string; analyses: number; tokens: number; errors: number; }
interface StressResult {
  target_users: number; expected_cpu_percent: number; expected_ram_percent: number;
  expected_analysis_duration_sec: number; expected_cost_per_day_usd: number;
  bottlenecks: string[]; feasibility: "green" | "yellow" | "red";
}

function GaugeBar({ value, warn = 70, danger = 85 }: { value: number; warn?: number; danger?: number }) {
  const color = value >= danger ? "bg-red-500" : value >= warn ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="w-full bg-ink/[0.06] rounded-full h-1.5 overflow-hidden">
      <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function RiskBadge({ risk }: { risk: "Low" | "Medium" | "High" }) {
  const cfg = {
    High: { cls: "bg-risk-high-bg text-risk-high-fg", Icon: AlertTriangle },
    Medium: { cls: "bg-risk-medium-bg text-risk-medium-fg", Icon: Activity },
    Low: { cls: "bg-risk-low-bg text-risk-low-fg", Icon: CheckCircle },
  }[risk];
  return (
    <span className={`chip ${cfg.cls} gap-1`}>
      <cfg.Icon size={11} /> {risk}
    </span>
  );
}

const PRESETS = [100, 500, 1000, 5000, 10000];

export function Capacity() {
  const { t } = useI18n();
  const [histHours, setHistHours] = useState(24);
  const [stressTarget, setStressTarget] = useState(1000);
  const [customVal, setCustomVal] = useState(1000);

  const snap = useQuery({
    queryKey: ["capacity-snapshot"],
    queryFn: async () => (await api.get<Snapshot>("/capacity/snapshot")).data,
    refetchInterval: 5_000,
  });

  const hist = useQuery({
    queryKey: ["capacity-history", histHours],
    queryFn: async () => (await api.get<HistoryPoint[]>("/capacity/history", { params: { hours: histHours } })).data,
    refetchInterval: 60_000,
  });

  const stress = useMutation({
    mutationFn: async (n: number) => (await api.post<StressResult>(`/capacity/stress-test?target_users=${n}`)).data,
  });

  const d = snap.data;
  const histData = (hist.data ?? []).map((p) => ({
    ...p,
    label: new Date(p.hour).toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">Admin</p>
          <h1 className="font-serif text-[26px] leading-tight">System Capacity</h1>
          <p className="text-[13.5px] text-ink-muted mt-2">Real-time server load, AI usage va sig'im tahlili</p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-ink-muted">
          <RefreshCw size={12} className={snap.isFetching ? "animate-spin" : ""} />
          <span>5s refresh</span>
        </div>
      </header>

      {/* Capacity Summary Banner */}
      {d && (
        <div className="rounded-2xl bg-ink p-6 text-white">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">Current Load</div>
              <div className="font-serif text-[40px] tabular-nums leading-none">{d.capacity.load_percent}%</div>
              <div className="mt-2"><GaugeBar value={d.capacity.load_percent} warn={40} danger={75} /></div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">Estimated Max</div>
              <div className="font-serif text-[40px] tabular-nums leading-none">{d.capacity.estimated_max_users.toLocaleString()}</div>
              <div className="text-[11px] text-white/40 mt-1">concurrent users</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">Active Now</div>
              <div className="font-serif text-[40px] tabular-nums leading-none">{d.capacity.current_active_users}</div>
              <div className="text-[11px] text-white/40 mt-1">last 1 hour</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-white/50 mb-2">Bottleneck Risk</div>
              <RiskBadge risk={d.capacity.risk} />
              {d.capacity.bottlenecks.length > 0 && (
                <div className="text-[11px] text-white/40 mt-2">{d.capacity.bottlenecks.join(" · ")}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Server + AI metrics */}
      {d && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Server */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Server size={15} className="text-ink-muted" />
              <h2 className="font-serif text-lg">Server Metrics</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: "CPU", value: d.system.cpu_percent, sub: `${d.system.cpu_percent}%`, icon: Cpu },
                { label: "RAM", value: d.system.ram_percent, sub: `${d.system.ram_used_gb} / ${d.system.ram_total_gb} GB`, icon: MemoryStick },
                { label: "Disk", value: d.system.disk_percent, sub: `${d.system.disk_used_gb} / ${d.system.disk_total_gb} GB`, icon: HardDrive },
              ].map(({ label, value, sub, icon: Icon }) => (
                <div key={label}>
                  <div className="flex justify-between text-[13px] mb-1.5">
                    <span className="flex items-center gap-1.5 text-ink-muted"><Icon size={13} />{label}</span>
                    <span className="tabular-nums font-medium">{sub}</span>
                  </div>
                  <GaugeBar value={value} />
                </div>
              ))}
              <div className="pt-3 border-t border-ink/[0.05] grid grid-cols-2 gap-2 text-[12px] text-ink-muted">
                <div><Wifi size={11} className="inline mr-1" />↑ {d.system.net_sent_mb} MB sent</div>
                <div><Wifi size={11} className="inline mr-1" />↓ {d.system.net_recv_mb} MB recv</div>
                <div><CircleDot size={11} className="inline mr-1" />Redis clients: {d.redis.connected_clients}</div>
                <div><CircleDot size={11} className="inline mr-1" />Queue: {d.redis.queue_length}</div>
              </div>
              {d.system.psutil_missing && (
                <p className="text-[11.5px] text-risk-medium-fg bg-risk-medium-bg rounded-lg px-3 py-2">
                  psutil not installed — server metrics unavailable. Run: <code className="font-mono">pip install psutil</code>
                </p>
              )}
            </div>
          </div>

          {/* AI + DB */}
          <div className="space-y-5">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={15} className="text-ink-muted" />
                <h2 className="font-serif text-lg">AI Metrics</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Tokens (1h)", value: d.ai.tokens_1h.toLocaleString() },
                  { label: "Tokens (24h)", value: (d.ai.tokens_24h / 1000).toFixed(1) + "k" },
                  { label: "Avg tokens/analysis", value: d.ai.avg_tokens_per_analysis.toLocaleString() },
                  { label: "Avg duration", value: d.ai.avg_analysis_duration_sec + "s" },
                  { label: "Running now", value: d.db.running_analyses },
                  { label: "Error rate (24h)", value: d.db.error_rate_percent + "%" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-sunken rounded-xl px-3 py-2.5">
                    <div className="text-[11px] text-ink-muted mb-0.5">{label}</div>
                    <div className="font-serif text-[18px] tabular-nums">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={15} className="text-ink-muted" />
                <h2 className="font-serif text-lg">User Activity</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total users", value: d.db.total_users.toLocaleString() },
                  { label: "Total documents", value: d.db.total_documents.toLocaleString() },
                  { label: "Active (1h)", value: d.db.active_users_1h },
                  { label: "Active (24h)", value: d.db.active_users_24h },
                  { label: "Analyses (1h)", value: d.db.analyses_1h },
                  { label: "Analyses (24h)", value: d.db.analyses_24h },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-sunken rounded-xl px-3 py-2.5">
                    <div className="text-[11px] text-ink-muted mb-0.5">{label}</div>
                    <div className="font-serif text-[18px] tabular-nums">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History charts */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-ink-muted" />
            <h2 className="font-serif text-lg">Usage History</h2>
          </div>
          <div className="flex gap-1">
            {[{ v: 24, l: "24h" }, { v: 48, l: "48h" }, { v: 168, l: "7d" }].map(({ v, l }) => (
              <button key={v} onClick={() => setHistHours(v)}
                className={`h-7 px-3 rounded-lg text-[12px] transition ${histHours === v ? "bg-accent text-white" : "bg-surface-sunken text-ink-muted hover:text-ink"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {histData.length > 0 ? (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] text-ink-muted mb-2 uppercase tracking-wide">Analyses per hour</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={histData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="analyses" stroke="#6366f1" fill="url(#gA)" strokeWidth={2} name="Analyses" />
                  <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name="Errors" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-[11px] text-ink-muted mb-2 uppercase tracking-wide">Tokens per hour</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={histData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="tokens" fill="#10b981" radius={[3, 3, 0, 0]} name="Tokens" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-ink-muted text-sm">Ma'lumot yo'q</div>
        )}
      </div>

      {/* Stress Test */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical size={15} className="text-ink-muted" />
          <h2 className="font-serif text-lg">Capacity Test</h2>
        </div>
        <p className="text-[12.5px] text-ink-muted mb-5">Simulyatsiya — haqiqiy yuklanish yo'q</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((n) => (
            <button key={n} onClick={() => setStressTarget(n)}
              className={`h-9 px-4 rounded-xl text-[13px] font-medium border transition ${stressTarget === n ? "border-accent bg-accent text-white" : "border-ink/[0.1] text-ink-muted hover:border-ink/30"}`}>
              {n.toLocaleString()}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <input type="number" value={customVal} min={1} max={100000}
              onChange={(e) => setCustomVal(Number(e.target.value))}
              className="input h-9 w-28 text-[13px] tabular-nums" />
            <button onClick={() => setStressTarget(customVal)}
              className="h-9 px-3 rounded-xl text-[13px] border border-ink/[0.1] text-ink-muted hover:border-ink/30 transition">
              Custom
            </button>
          </div>
        </div>

        <button
          disabled={stress.isPending}
          onClick={() => stress.mutate(stressTarget)}
          className="btn-primary"
        >
          <FlaskConical size={15} />
          {stress.isPending ? "Simulyatsiya..." : `Test (${stressTarget.toLocaleString()} users)`}
        </button>

        {stress.data && (
          <div className={`mt-5 rounded-2xl p-5 border ${
            stress.data.feasibility === "red" ? "bg-risk-high-bg border-risk-high-fg/20" :
            stress.data.feasibility === "yellow" ? "bg-risk-medium-bg border-risk-medium-fg/20" :
            "bg-risk-low-bg border-risk-low-fg/20"
          }`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Expected CPU", value: stress.data.expected_cpu_percent + "%", bad: stress.data.expected_cpu_percent > 70 },
                { label: "Expected RAM", value: stress.data.expected_ram_percent + "%", bad: stress.data.expected_ram_percent > 70 },
                { label: "Analysis time", value: stress.data.expected_analysis_duration_sec + "s", bad: stress.data.expected_analysis_duration_sec > 120 },
                { label: "Cost/day", value: "$" + stress.data.expected_cost_per_day_usd, bad: stress.data.expected_cost_per_day_usd > 50 },
              ].map(({ label, value, bad }) => (
                <div key={label}>
                  <div className="text-[11px] text-ink-muted mb-0.5">{label}</div>
                  <div className={`font-serif text-[22px] tabular-nums ${bad ? "text-risk-high-fg" : "text-ink"}`}>{value}</div>
                </div>
              ))}
            </div>
            {stress.data.bottlenecks.length > 0 && (
              <div className="flex items-center gap-1.5 text-[12.5px] text-risk-high-fg">
                <AlertTriangle size={13} />
                Bottlenecks: {stress.data.bottlenecks.join(", ")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
