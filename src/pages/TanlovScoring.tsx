import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Ariza, ArizaScore, Tanlov as TanlovT } from "@/types";
import { Gavel, ArrowUpRight, ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { Skeleton, TableSkeleton } from "@/components/shared/Skeleton";

function ScoringQueue() {
  const { t } = useI18n();
  const { data: tanlovlar = [], isLoading } = useQuery({
    queryKey: ["tanlovlar"],
    queryFn: async () => (await api.get<TanlovT[]>("/tender")).data,
  });
  const scoring = tanlovlar.filter((tv) => tv.status === "announced" || tv.status === "intake_closed");

  return (
    <div className="space-y-7 animate-fade-in">
      <header>
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("tender.section")}</p>
        <h1 className="font-serif text-[26px] leading-tight">{t("tender.scoring_title")}</h1>
      </header>

      {scoring.length === 0 && !isLoading ? (
        <div className="card p-14 flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="h-14 w-14 rounded-2xl bg-surface-sunken text-ink-subtle grid place-items-center">
            <Gavel size={24} strokeWidth={1.5} />
          </div>
          <p className="font-serif text-lg text-ink">{t("tender.scoring_empty")}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                  <th className="text-left font-medium px-6 py-3">{t("tender.col_title")}</th>
                  <th className="py-3 pr-6"></th>
                </tr>
              </thead>
              {isLoading ? <TableSkeleton rows={3} cols={2} /> : <tbody>
                {scoring.map((tv) => (
                  <tr key={tv.id} className="border-t border-ink/[0.05] hover:bg-surface-sunken/40">
                    <td className="px-6 py-3 text-[14px] font-medium text-ink">{tv.title}</td>
                    <td className="pr-6 py-3 text-right">
                      <Link to={`/tender-scoring/${tv.id}`} className="btn-primary h-8 px-3 text-[12.5px] inline-flex">
                        {t("tender.view_arizalar")} <ArrowUpRight size={14} />
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

function ArizaScoreForm({ arizaId }: { arizaId: string }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: ariza } = useQuery({
    queryKey: ["ariza-staff", arizaId],
    queryFn: async () => (await api.get<Ariza>(`/tender/arizalar/${arizaId}`)).data,
  });

  const { data: score, isLoading: scoreLoading } = useQuery({
    queryKey: ["ariza-score", arizaId],
    queryFn: async () => (await api.get<ArizaScore>(`/tender/arizalar/${arizaId}/score`)).data,
  });

  const [points, setPoints] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!score) return;
    const p: Record<string, string> = {};
    for (const it of score.items) p[it.criterion_key] = it.awarded_points != null ? String(it.awarded_points) : "";
    setPoints(p);
    setComment(score.comment || "");
  }, [score]);

  const isSubmitted = score?.status === "submitted";
  const total = (score?.items || []).reduce((sum, it) => sum + Number(points[it.criterion_key] || 0), 0);
  const allFilled = (score?.items || []).every((it) => points[it.criterion_key] !== "" && points[it.criterion_key] !== undefined);

  function buildItems() {
    return (score?.items || []).map((it) => ({
      criterion_key: it.criterion_key,
      awarded_points: points[it.criterion_key] === "" ? null : Number(points[it.criterion_key]),
    }));
  }

  const saveDraft = useMutation({
    mutationFn: async () =>
      (await api.put(`/tender/arizalar/${arizaId}/score`, { comment: comment || null, items: buildItems() })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ariza-score", arizaId] }); toast.success(t("tender.draft_saved")); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const submit = useMutation({
    mutationFn: async () => {
      await api.put(`/tender/arizalar/${arizaId}/score`, { comment: comment || null, items: buildItems() });
      return (await api.post(`/tender/arizalar/${arizaId}/score/submit`)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ariza-score", arizaId] });
      toast.success(t("tender.score_submitted"));
      nav(-1);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  if (scoreLoading) {
    return (
      <div className="space-y-7 animate-fade-in">
        <Skeleton className="h-4 w-24" />
        <div className="card p-7 space-y-3"><Skeleton className="h-24 w-full" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <button onClick={() => nav(-1)} className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> {t("common.back")}
      </button>

      <header className="flex items-center gap-3">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("tender.section")}</p>
          <h1 className="font-serif text-[24px] leading-tight">{ariza?.organization_name || t("tender.arizalar_title")}</h1>
        </div>
        {isSubmitted && (
          <span className="chip bg-accent-50 text-accent-700 ml-auto">
            <CheckCircle2 size={13} /> {t("tender.already_scored")}
          </span>
        )}
      </header>

      <div className="card p-6 space-y-5">
        <div>
          <label className="label mb-2 block">{t("tender.rubric_title")}</label>
          <div className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.08]">
            {(score?.items || []).map((it) => (
              <div key={it.criterion_key} className="flex items-center gap-3 px-4 py-3">
                <span className="text-[13.5px] text-ink flex-1">{t(`tender.criterion_${it.criterion_key}`)}</span>
                <input
                  type="number" min={0} max={Number(it.max_points)} disabled={isSubmitted}
                  className="input w-20 text-center" value={points[it.criterion_key] ?? ""}
                  onChange={(e) => setPoints((prev) => ({ ...prev, [it.criterion_key]: e.target.value }))}
                />
                <span className="text-[12px] text-ink-subtle w-16 shrink-0">/ {it.max_points}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-1 pt-2">
            <span className="text-[12.5px] text-ink-muted">{t("tender.total_score")}</span>
            <span className={`text-[16px] font-serif ${total >= 70 ? "text-risk-low-fg" : "text-ink"}`}>{total} / 100</span>
          </div>
          {total >= 70 && <p className="text-[11.5px] text-risk-low-fg">{t("tender.recommend_hint")}</p>}
        </div>
        <div>
          <label className="label">{t("tender.comment")}</label>
          <textarea className="textarea" rows={4} disabled={isSubmitted} value={comment}
            onChange={(e) => setComment(e.target.value)} />
        </div>
        {!isSubmitted && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending} className="btn-secondary flex-1">
              <Save size={15} /> {saveDraft.isPending ? t("common.loading") : t("tender.save_draft")}
            </button>
            <button onClick={() => submit.mutate()} disabled={submit.isPending || !allFilled} className="btn-primary flex-1">
              {submit.isPending ? t("common.loading") : t("tender.submit_score")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TanlovArizaScoringList({ tanlovId }: { tanlovId: string }) {
  const { t } = useI18n();
  const { data: arizalar = [], isLoading } = useQuery({
    queryKey: ["tanlov-arizalar", tanlovId],
    queryFn: async () => (await api.get<Ariza[]>(`/tender/${tanlovId}/arizalar`)).data,
  });
  const scoringArizalar = arizalar.filter((a) => a.status === "scoring");

  return (
    <div className="space-y-7 animate-fade-in">
      <Link to="/tender-scoring" className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> {t("common.back")}
      </Link>
      <header>
        <h1 className="font-serif text-[24px] leading-tight">{t("tender.scoring_title")}</h1>
      </header>
      {scoringArizalar.length === 0 && !isLoading ? (
        <div className="card p-10 text-center text-[13.5px] text-ink-muted">{t("tender.scoring_empty")}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                  <th className="text-left font-medium px-6 py-3">{t("tender.col_organization")}</th>
                  <th className="py-3 pr-6"></th>
                </tr>
              </thead>
              <tbody>
                {scoringArizalar.map((a) => (
                  <tr key={a.id} className="border-t border-ink/[0.05] hover:bg-surface-sunken/40">
                    <td className="px-6 py-3 text-[14px] font-medium text-ink">{a.organization_name || "—"}</td>
                    <td className="pr-6 py-3 text-right">
                      <Link to={`/tender-scoring/ariza/${a.id}`} className="btn-primary h-8 px-3 text-[12.5px] inline-flex">
                        {t("tender.score_this")} <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function TanlovScoring() {
  const { tanlovId, arizaId } = useParams();
  if (arizaId) return <ArizaScoreForm arizaId={arizaId} />;
  if (tanlovId) return <TanlovArizaScoringList tanlovId={tanlovId} />;
  return <ScoringQueue />;
}
