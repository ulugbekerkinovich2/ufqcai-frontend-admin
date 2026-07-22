import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Ariza, ArizaScore, Tanlov as TanlovT } from "@/types";
import { Gavel, ArrowUpRight, ArrowLeft, Save, CheckCircle2, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
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

  const [vote, setVote] = useState<string>("");
  const [scoreVal, setScoreVal] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!score) return;
    setVote(score.vote || "");
    setScoreVal(score.score != null ? String(score.score) : "");
    setComment(score.comment || "");
  }, [score]);

  const isSubmitted = score?.status === "submitted";

  const saveDraft = useMutation({
    mutationFn: async () =>
      (await api.put(`/tender/arizalar/${arizaId}/score`, {
        vote: vote || null, score: scoreVal ? Number(scoreVal) : null, comment: comment || null,
      })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ariza-score", arizaId] }); toast.success(t("tender.draft_saved")); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const submit = useMutation({
    mutationFn: async () => {
      await api.put(`/tender/arizalar/${arizaId}/score`, {
        vote: vote || null, score: scoreVal ? Number(scoreVal) : null, comment: comment || null,
      });
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
          <label className="label mb-2 block">{t("tender.vote")}</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: "for", icon: ThumbsUp, cls: "text-risk-low-fg" },
              { v: "abstain", icon: Minus, cls: "text-ink-muted" },
              { v: "against", icon: ThumbsDown, cls: "text-risk-high-fg" },
            ] as const).map(({ v, icon: Icon, cls }) => (
              <button key={v} type="button" disabled={isSubmitted} onClick={() => setVote(v)}
                className={`p-3 rounded-xl border-2 text-center text-[13px] font-medium transition flex flex-col items-center gap-1 ${
                  vote === v ? "bg-accent-50 text-accent-700 border-accent" : "bg-surface border-ink/[0.08] hover:border-ink/20"
                }`}>
                <Icon size={16} className={vote === v ? "" : cls} /> {t(`tender.vote_${v}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">{t("tender.score")}</label>
          <input type="number" min={0} max={100} className="input" disabled={isSubmitted} value={scoreVal}
            onChange={(e) => setScoreVal(e.target.value)} />
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
            <button onClick={() => submit.mutate()} disabled={submit.isPending || !vote} className="btn-primary flex-1">
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
