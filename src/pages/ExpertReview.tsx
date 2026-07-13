import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";
import type { Document, Criterion, Analysis, ExpertReview as ExpertReviewT, RiskLevel } from "@/types";
import { FileText, ArrowUpRight, ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { TableSkeleton, Skeleton } from "@/components/shared/Skeleton";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { ScoreGauge } from "@/components/shared/ScoreGauge";

const RISK_LEVELS: RiskLevel[] = ["None", "Low", "Medium", "High"];

function ExpertQueue() {
  const { t } = useI18n();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["expert-queue"],
    queryFn: async () => (await api.get<Document[]>("/expert/queue")).data,
  });

  return (
    <div className="space-y-7 animate-fade-in">
      <header>
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("expert.section")}</p>
        <h1 className="font-serif text-[26px] leading-tight">{t("expert.queue_title")}</h1>
      </header>

      {items.length === 0 && !isLoading ? (
        <div className="card p-14 flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="h-14 w-14 rounded-2xl bg-surface-sunken text-ink-subtle grid place-items-center">
            <FileText size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-serif text-lg text-ink">{t("expert.empty_title")}</p>
            <p className="text-[13px] text-ink-muted mt-1">{t("expert.empty_hint")}</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                  <th className="text-left font-medium px-6 py-3">{t("documents.col_name")}</th>
                  <th className="text-left font-medium py-3 w-40">{t("expert.assigned_at")}</th>
                  <th className="py-3 pr-6"></th>
                </tr>
              </thead>
              {isLoading ? <TableSkeleton rows={4} cols={3} /> : <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-t border-ink/[0.05] hover:bg-surface-sunken/40">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-surface-sunken text-ink-muted grid place-items-center shrink-0">
                          <FileText size={14} strokeWidth={1.75} />
                        </div>
                        <div className="text-[14px] font-medium text-ink">{d.title}</div>
                      </div>
                    </td>
                    <td className="py-3 text-[13px] text-ink-muted">{d.assigned_at ? formatDate(d.assigned_at) : "—"}</td>
                    <td className="pr-6 py-3 text-right">
                      <Link to={`/expert-review/${d.id}`} className="btn-primary h-8 px-3 text-[12.5px] inline-flex">
                        {t("expert.evaluate")} <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpertReviewDetail({ docId }: { docId: string }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: doc } = useQuery({
    queryKey: ["document", docId],
    queryFn: async () => (await api.get<Document>(`/documents/${docId}`)).data,
  });

  const { data: criteria = [] } = useQuery({
    queryKey: ["criteria"],
    queryFn: async () => (await api.get<Criterion[]>("/criteria")).data,
  });

  const { data: analysesList = [] } = useQuery({
    queryKey: ["document-analyses", docId],
    queryFn: async () => (await api.get<Analysis[]>(`/documents/${docId}/analyses`)).data,
  });
  const latestAnalysis = useMemo(
    () => [...analysesList].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0],
    [analysesList],
  );

  const { data: analysisDetail } = useQuery({
    queryKey: ["analysis", latestAnalysis?.id],
    queryFn: async () => (await api.get<Analysis>(`/analyses/${latestAnalysis!.id}`)).data,
    enabled: !!latestAnalysis && latestAnalysis.status === "completed",
  });

  const { data: review, isLoading: reviewLoading } = useQuery({
    queryKey: ["expert-review", docId],
    queryFn: async () => (await api.get<ExpertReviewT>(`/expert/${docId}/review`)).data,
  });

  const [verdict, setVerdict] = useState<string>("");
  const [comment, setComment] = useState("");
  const [items, setItems] = useState<Record<string, { risk_level: string; score: string; comment: string }>>({});

  useEffect(() => {
    if (!review) return;
    setVerdict(review.overall_verdict || "");
    setComment(review.overall_comment || "");
    const byName: Record<string, { risk_level: string; score: string; comment: string }> = {};
    for (const it of review.items) {
      byName[it.criterion_name || ""] = {
        risk_level: it.risk_level || "None",
        score: it.score != null ? String(it.score) : "",
        comment: it.comment || "",
      };
    }
    setItems(byName);
  }, [review]);

  const isSubmitted = review?.status === "submitted";

  function itemFor(name: string) {
    return items[name] || { risk_level: "None", score: "", comment: "" };
  }
  function setItem(name: string, patch: Partial<{ risk_level: string; score: string; comment: string }>) {
    setItems((prev) => ({ ...prev, [name]: { ...itemFor(name), ...patch } }));
  }

  function buildPayload() {
    return {
      overall_verdict: verdict || null,
      overall_comment: comment || null,
      items: criteria.map((c) => ({
        criterion_id: c.id,
        criterion_name: c.name,
        risk_level: itemFor(c.name).risk_level,
        score: itemFor(c.name).score ? Number(itemFor(c.name).score) : null,
        comment: itemFor(c.name).comment || null,
      })),
    };
  }

  const saveDraft = useMutation({
    mutationFn: async () => (await api.put(`/expert/${docId}/review`, buildPayload())).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expert-review", docId] });
      toast.success(t("expert.draft_saved"));
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const submit = useMutation({
    mutationFn: async () => {
      await api.put(`/expert/${docId}/review`, buildPayload());
      return (await api.post(`/expert/${docId}/review/submit`)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expert-review", docId] });
      qc.invalidateQueries({ queryKey: ["expert-queue"] });
      toast.success(t("expert.submitted"));
      nav("/expert-review");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const aiResultByName = useMemo(() => {
    const map: Record<string, { risk_level?: string; score?: number | string; finding?: string }> = {};
    for (const r of analysisDetail?.results || []) {
      if (r.criterion_name) map[r.criterion_name] = r;
    }
    return map;
  }, [analysisDetail]);

  if (reviewLoading || !doc) {
    return (
      <div className="space-y-7 animate-fade-in">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-96" />
        </div>
        <div className="card p-6">
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="card p-7 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <Link to="/expert-review" className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> {t("common.back")}
      </Link>

      <header className="flex items-center gap-3">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("expert.section")}</p>
          <h1 className="font-serif text-[24px] leading-tight">{doc.title}</h1>
        </div>
        {isSubmitted && (
          <span className="chip bg-accent-50 text-accent-700 ml-auto">
            <CheckCircle2 size={13} /> {t("expert.already_submitted")}
          </span>
        )}
      </header>

      {analysisDetail?.status === "completed" && (
        <div className="card p-6 flex items-center gap-6">
          <ScoreGauge value={Number(analysisDetail.overall_score || 0)} size={96} />
          <div>
            <p className="text-[12.5px] uppercase tracking-wide text-ink-muted mb-1">{t("expert.ai_result")}</p>
            <RiskBadge level={analysisDetail.overall_risk} />
            {analysisDetail.summary && <p className="text-[13px] text-ink-muted mt-2 max-w-lg">{analysisDetail.summary}</p>}
          </div>
        </div>
      )}
      {latestAnalysis && latestAnalysis.status !== "completed" && (
        <div className="card p-5 text-[13px] text-ink-muted">{t("expert.ai_pending")}</div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 pt-5 pb-1 flex items-center gap-4 text-[11px] text-ink-subtle">
          <span className="uppercase tracking-wide">{t("expert.col_criterion")}</span>
          <span className="ml-auto uppercase tracking-wide flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" /> {t("expert.legend_ai")}
          </span>
          <span className="uppercase tracking-wide flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t("expert.legend_manual")}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                <th className="text-left font-medium px-6 py-3">{t("expert.col_criterion")}</th>
                <th className="text-left font-medium py-3 w-36 bg-surface-sunken/40">{t("expert.col_ai")}</th>
                <th className="text-left font-medium py-3 w-40 border-l-2 border-accent/20 pl-4">{t("expert.col_risk")}</th>
                <th className="text-left font-medium py-3 w-24">{t("expert.col_score")}</th>
                <th className="text-left font-medium py-3">{t("expert.col_comment")}</th>
              </tr>
            </thead>
            <tbody>
              {criteria.filter((c) => c.is_active).map((c) => {
                const ai = aiResultByName[c.name];
                const it = itemFor(c.name);
                return (
                  <tr key={c.id} className="border-t border-ink/[0.05]">
                    <td className="px-6 py-3 text-[13.5px] text-ink font-medium">{c.name}</td>
                    <td className="py-3 bg-surface-sunken/40">
                      {ai ? (
                        <div className="flex items-center gap-2">
                          <RiskBadge level={ai.risk_level} size="sm" />
                          {ai.score != null && <span className="text-[12px] text-ink-subtle tabular-nums">{ai.score}</span>}
                        </div>
                      ) : <span className="text-ink-subtle text-[12px]">—</span>}
                    </td>
                    <td className="py-3 border-l-2 border-accent/20 pl-4">
                      <select
                        className="input h-9 text-[13px]" disabled={isSubmitted}
                        aria-label={`${c.name} — ${t("expert.col_risk")}`}
                        value={it.risk_level} onChange={(e) => setItem(c.name, { risk_level: e.target.value })}
                      >
                        {RISK_LEVELS.map((r) => <option key={r} value={r}>{t(`risk.${r}`)}</option>)}
                      </select>
                    </td>
                    <td className="py-3">
                      <input
                        type="number" min={0} max={100} step={0.5} disabled={isSubmitted}
                        aria-label={`${c.name} — ${t("expert.col_score")}`}
                        className="input h-9 text-[13px] font-mono" value={it.score}
                        onChange={(e) => setItem(c.name, { score: e.target.value })}
                      />
                    </td>
                    <td className="py-3 pr-6">
                      <input
                        className="input h-9 text-[13px]" disabled={isSubmitted}
                        aria-label={`${c.name} — ${t("expert.col_comment")}`}
                        value={it.comment} onChange={(e) => setItem(c.name, { comment: e.target.value })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="label mb-2 block">{t("expert.overall_verdict")}</label>
          <div className="grid grid-cols-3 gap-2">
            {(["approved", "needs_revision", "rejected"] as const).map((v) => (
              <button key={v} type="button" disabled={isSubmitted} onClick={() => setVerdict(v)}
                className={`p-3 rounded-xl border-2 text-center text-[13px] font-medium transition ${
                  verdict === v ? "bg-accent-50 text-accent-700 border-accent" : "bg-surface border-ink/[0.08] hover:border-ink/20"
                }`}>
                {t(`expert.verdict_${v}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">{t("expert.overall_comment")}</label>
          <textarea className="textarea" rows={4} disabled={isSubmitted} value={comment}
            onChange={(e) => setComment(e.target.value)} />
        </div>
        {!isSubmitted && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending} className="btn-secondary flex-1">
              <Save size={15} /> {saveDraft.isPending ? t("common.loading") : t("expert.save_draft")}
            </button>
            <button onClick={() => submit.mutate()} disabled={submit.isPending || !verdict} className="btn-primary flex-1">
              {submit.isPending ? t("common.loading") : t("expert.submit")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ExpertReview() {
  const { docId } = useParams();
  return docId ? <ExpertReviewDetail docId={docId} /> : <ExpertQueue />;
}
