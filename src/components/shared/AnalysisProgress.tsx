import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, FileSearch, BookOpen, Brain, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/api/client";

interface Step {
  key: string;
  label: string;
  hint: string;
  icon: any;
  stages: string[];   // backend progress_stage qiymatlari
  range: [number, number];   // ushbu qadam egallaydigan foiz oralig'i
}

interface StatusResp {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  error_message?: string | null;
  progress_stage?: string | null;
  progress_percent?: number | null;
}

function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function AnalysisProgress({ startedAt, analysisId }: { startedAt?: string; analysisId?: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [elapsed, setElapsed] = useState(0);

  // Backend status'dan real progress
  const statusQ = useQuery({
    queryKey: ["analysis-status", analysisId],
    queryFn: async () => (await api.get<StatusResp>(`/analyses/${analysisId}/status`)).data,
    enabled: !!analysisId,
    refetchInterval: 2000,
  });

  const stage = statusQ.data?.progress_stage || "queued";
  const percent = statusQ.data?.progress_percent ?? 0;
  const statusDone = statusQ.data?.status === "completed" || statusQ.data?.status === "failed";

  // statusQ "completed"/"failed" aniqlasa — parent aQ ni darhol invalidate qil
  useEffect(() => {
    if (statusDone && analysisId) {
      qc.invalidateQueries({ queryKey: ["analysis", analysisId] });
    }
  }, [statusDone, analysisId]);

  // ETA — so'nggi tahlillarning o'rtachasi
  const etaQ = useQuery({
    queryKey: ["analysis-eta"],
    queryFn: async () => (await api.get<{ avg_seconds: number; samples: number }>("/analyses/eta")).data,
    staleTime: 5 * 60 * 1000,
  });
  const avg = etaQ.data?.avg_seconds ?? 90;
  const samples = etaQ.data?.samples ?? 0;

  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const steps: Step[] = [
    {
      key: "parse",
      label: t("progress.parse"),
      hint: t("progress.parse_hint"),
      icon: FileSearch,
      stages: ["queued", "parsing"],
      range: [0, 15],
    },
    {
      key: "rag",
      label: t("progress.rag"),
      hint: t("progress.rag_hint"),
      icon: BookOpen,
      stages: ["retrieving_laws"],
      range: [15, 20],
    },
    {
      key: "ai",
      label: t("progress.ai"),
      hint: t("progress.ai_hint"),
      icon: Brain,
      stages: ["ai_analyzing"],
      range: [20, 85],
    },
    {
      key: "save",
      label: t("progress.save"),
      hint: t("progress.save_hint"),
      icon: Save,
      stages: ["saving", "completed"],
      range: [85, 100],
    },
  ];

  const activeIndex = steps.findIndex((s) => s.stages.includes(stage));
  const active = activeIndex >= 0 ? activeIndex : 0;

  // Joriy qadam ichidagi foiz (0-100)
  function stagePct(s: Step): number {
    if (percent <= s.range[0]) return 0;
    if (percent >= s.range[1]) return 100;
    const span = s.range[1] - s.range[0];
    return Math.round(((percent - s.range[0]) / span) * 100);
  }

  const remaining = Math.max(0, avg - elapsed);
  const overrun = elapsed > avg && percent < 90;

  return (
    <div className="card p-10 animate-fade-in">
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-accent-50 to-accent-100 grid place-items-center mx-auto relative">
            <Loader2 size={28} className="animate-spin text-accent" strokeWidth={1.75} />
            <span className="absolute inset-0 rounded-full ring-2 ring-accent/40 animate-ping" />
          </div>
        </div>
        <h2 className="font-serif text-2xl mt-5 text-ink">{t("analysis.running")}</h2>
        <div className="mt-2 inline-flex items-center gap-2 text-[13px] text-ink-muted flex-wrap justify-center">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
          {t("progress.elapsed")}: <span className="font-mono tabular-nums text-ink">{fmtTime(elapsed)}</span>
          <span className="text-ink-subtle">·</span>
          {overrun ? (
            <span className="text-ink-subtle">{t("progress.almost_done")}</span>
          ) : (
            <span className="text-ink-subtle">
              {t("progress.eta")}: <span className="font-mono tabular-nums text-ink-muted">{fmtTime(remaining)}</span>
              {samples > 0 && (
                <span className="text-[11px] ml-1.5 text-ink-subtle">({t("progress.based_on")} {samples})</span>
              )}
            </span>
          )}
        </div>

        {/* Umumiy progress bar — backend percent */}
        <div className="mt-5 max-w-md mx-auto">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[11.5px] text-ink-muted">{t("progress.overall")}</span>
            <span className="text-[13px] font-mono tabular-nums text-ink font-semibold">{percent}%</span>
          </div>
          <div className="h-2 w-full bg-surface-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto space-y-3">
        {steps.map((s, i) => {
          const done = i < active || percent >= s.range[1];
          const current = i === active && !done;
          const pct = stagePct(s);
          return (
            <div
              key={s.key}
              className={`p-3.5 rounded-xl transition-all ${
                current ? "bg-accent-50/60 ring-1 ring-accent/30" :
                done ? "bg-surface-sunken/50" :
                "opacity-50"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${
                  done ? "bg-accent text-white" :
                  current ? "bg-accent-50 text-accent" :
                  "bg-surface-sunken text-ink-subtle"
                }`}>
                  {done ? <CheckCircle2 size={17} /> :
                   current ? <s.icon size={16} className="animate-pulse-soft" /> :
                   <s.icon size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[14.5px] font-medium ${current ? "text-accent-700" : done ? "text-ink" : "text-ink-muted"} flex items-center gap-2 flex-wrap`}>
                    {s.label}
                    {current && (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-normal text-accent">
                        <Loader2 size={11} className="animate-spin" />
                        <span className="font-mono tabular-nums">{pct}%</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[12.5px] text-ink-muted mt-0.5">{s.hint}</div>
                </div>
              </div>

              {/* Joriy qadam ichidagi progress */}
              {current && (
                <div className="mt-2.5 ml-[3.125rem]">
                  <div className="h-1 w-full bg-surface-sunken rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center text-[12px] text-ink-subtle mt-8 max-w-md mx-auto">
        {t("progress.note")}
      </div>
    </div>
  );
}
