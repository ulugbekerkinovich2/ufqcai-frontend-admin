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
const RISK_RANK: Record<string, number> = { None: 0, Low: 1, Medium: 2, High: 3 };
const MAX_AI_FINDINGS = 5;

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
  // AI natijasi bor mezonlar uchun — ekspert faqat "qo'shilaman" belgilaydi (tez baholash,
  // aktyor/aktrisa kabi ekspertlar har mezon uchun qo'lda yozib o'tirmasin).
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  // AI natijasi yo'q (kamdan-kam) mezonlar uchun — eski qo'lda kiritish fallback.
  const [manualItems, setManualItems] = useState<Record<string, { risk_level: string; score: string; comment: string }>>({});

  useEffect(() => {
    if (!review) return;
    setVerdict(review.overall_verdict || "");
    setComment(review.overall_comment || "");
    const agreed: Record<string, boolean> = {};
    const manual: Record<string, { risk_level: string; score: string; comment: string }> = {};
    for (const it of review.items) {
      const name = it.criterion_name || "";
      if (it.agrees_with_ai != null) {
        agreed[name] = it.agrees_with_ai;
      } else {
        manual[name] = {
          risk_level: it.risk_level || "None",
          score: it.score != null ? String(it.score) : "",
          comment: it.comment || "",
        };
      }
    }
    setAgreements(agreed);
    setManualItems(manual);
  }, [review]);

  const isSubmitted = review?.status === "submitted";

  function manualItemFor(name: string) {
    return manualItems[name] || { risk_level: "None", score: "", comment: "" };
  }
  function setManualItem(name: string, patch: Partial<{ risk_level: string; score: string; comment: string }>) {
    setManualItems((prev) => ({ ...prev, [name]: { ...manualItemFor(name), ...patch } }));
  }

  function buildPayload() {
    return {
      overall_verdict: verdict || null,
      overall_comment: comment || null,
      items: criteria.map((c) => {
        const ai = aiResultByName[c.name];
        if (ai) {
          return {
            criterion_id: c.id,
            criterion_name: c.name,
            risk_level: ai.risk_level || null,
            score: ai.score != null ? Number(ai.score) : null,
            comment: null,
            agrees_with_ai: agreements[c.name] ?? false,
          };
        }
        const m = manualItemFor(c.name);
        return {
          criterion_id: c.id,
          criterion_name: c.name,
          risk_level: m.risk_level,
          score: m.score ? Number(m.score) : null,
          comment: m.comment || null,
          agrees_with_ai: null,
        };
      }),
    };
  }

  const canSubmit = !!verdict && comment.trim().length > 0;

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

  // AI 40+ mezonni to'liq baholaydi (rasmiy yozuv uchun), lekin ekspertga faqat FAQAT
  // "Yuqori" xavfli topilmalarni (maksimal 5 tasini) checkbox qilib ko'rsatamiz —
  // O'rta/Past/Yo'q darajalar diqqatga arzimaydi, ro'yxatga chiqmaydi.
  const topAiCriteria = useMemo(() => {
    return criteria
      .filter((c) => c.is_active && aiResultByName[c.name]?.risk_level === "High")
      .sort((a, b) => (RISK_RANK[aiResultByName[b.name]?.risk_level || "None"] ?? 0) - (RISK_RANK[aiResultByName[a.name]?.risk_level || "None"] ?? 0))
      .slice(0, MAX_AI_FINDINGS);
  }, [criteria, aiResultByName]);
  const topAiNames = useMemo(() => new Set(topAiCriteria.map((c) => c.name)), [topAiCriteria]);
  const hiddenAiCount = useMemo(
    () => criteria.filter((c) => c.is_active && aiResultByName[c.name] && !topAiNames.has(c.name)).length,
    [criteria, aiResultByName, topAiNames],
  );

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
        <div className="px-6 pt-5 pb-4">
          <p className="text-[12.5px] uppercase tracking-wide text-ink-muted mb-0.5">{t("expert.agree_title")}</p>
          <p className="text-[12.5px] text-ink-subtle">{t("expert.agree_hint")}</p>
        </div>
        <div className="divide-y divide-ink/[0.05]">
          {topAiCriteria.map((c) => {
            const ai = aiResultByName[c.name]!;
            const checked = !!agreements[c.name];
            return (
              <label
                key={c.id}
                className={`flex items-start gap-3.5 px-6 py-4 cursor-pointer transition ${checked ? "bg-accent-50/40" : "hover:bg-surface-sunken/40"} ${isSubmitted ? "cursor-default" : ""}`}
              >
                <input
                  type="checkbox" disabled={isSubmitted}
                  className="mt-1 h-4 w-4 accent-accent shrink-0 cursor-pointer"
                  checked={checked}
                  onChange={(e) => setAgreements((prev) => ({ ...prev, [c.name]: e.target.checked }))}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-medium text-ink">{c.name}</span>
                    <RiskBadge level={ai.risk_level} size="sm" />
                  </div>
                  {ai.finding && <p className="text-[12.5px] text-ink-muted mt-1 leading-relaxed">{ai.finding}</p>}
                </div>
              </label>
            );
          })}
        </div>
        {hiddenAiCount > 0 && (
          <div className="px-6 py-3 text-[11.5px] text-ink-subtle border-t border-ink/[0.05]">
            {t("expert.hidden_count").replace("{n}", String(hiddenAiCount))}
          </div>
        )}
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
          <label className="label">
            {t("expert.overall_comment")} <span className="text-risk-high-fg">*</span>
          </label>
          <textarea className="textarea" rows={4} disabled={isSubmitted} value={comment}
            placeholder={t("expert.overall_comment_placeholder")}
            onChange={(e) => setComment(e.target.value)} />
          {!isSubmitted && !comment.trim() && (
            <p className="text-[11.5px] text-risk-high-fg mt-1">{t("expert.comment_required")}</p>
          )}
        </div>
        {!isSubmitted && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending} className="btn-secondary flex-1">
              <Save size={15} /> {saveDraft.isPending ? t("common.loading") : t("expert.save_draft")}
            </button>
            <button onClick={() => submit.mutate()} disabled={submit.isPending || !canSubmit} className="btn-primary flex-1">
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
