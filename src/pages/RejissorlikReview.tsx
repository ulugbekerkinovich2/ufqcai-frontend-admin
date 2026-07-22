import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/store/auth";
import type { Ariza, RejissorlikSmeta } from "@/types";
import { ArrowLeft, CheckCircle2, Ban, ClipboardCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/shared/Skeleton";

const STATUS_CLS: Record<string, string> = {
  pending_ishchi_guruh: "bg-risk-medium-bg text-risk-medium-fg",
  ishchi_guruh_rejected: "bg-risk-high-bg text-risk-high-fg",
  pending_komissiya: "bg-accent-50 text-accent-700",
  approved: "bg-risk-low-bg text-risk-low-fg",
  rejected: "bg-risk-high-bg text-risk-high-fg",
};

export function RejissorlikReview() {
  const { arizaId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const isSuper = user?.role === "super_admin";
  const isAdmin = isSuper || user?.role === "admin";
  const isMutaxassis = isAdmin || user?.role === "mutaxassis";
  const isKomissiya = isAdmin || user?.role === "komissiya";

  const { data: ariza } = useQuery({
    queryKey: ["ariza-staff", arizaId],
    queryFn: async () => (await api.get<Ariza>(`/tender/arizalar/${arizaId}`)).data,
  });

  const { data: smeta, isLoading } = useQuery({
    queryKey: ["rejissorlik-smeta", arizaId],
    queryFn: async () => (await api.get<RejissorlikSmeta>(`/tender/arizalar/${arizaId}/rejissorlik`)).data,
  });

  const ishchiGuruhReview = useMutation({
    mutationFn: async (approve: boolean) =>
      (await api.post(`/tender/rejissorlik/${smeta!.id}/ishchi-guruh-review`, { approve, note: note || null })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rejissorlik-smeta", arizaId] }); toast.success(t("tender.rejissorlik_reviewed")); setNote(""); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const komissiyaApprove = useMutation({
    mutationFn: async (approve: boolean) =>
      (await api.post(`/tender/rejissorlik/${smeta!.id}/komissiya-approve`, { approve })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rejissorlik-smeta", arizaId] }); toast.success(t("tender.rejissorlik_approved")); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  if (isLoading || !smeta) {
    return (
      <div className="space-y-7 animate-fade-in">
        <Skeleton className="h-4 w-24" />
        <div className="card p-6"><Skeleton className="h-24 w-full" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <button onClick={() => nav(-1)} className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> {t("common.back")}
      </button>

      <header className="flex items-center gap-3 flex-wrap">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("tender.rejissorlik_review")}</p>
          <h1 className="font-serif text-[24px] leading-tight">{ariza?.organization_name || "—"}</h1>
        </div>
        <span className={`chip ${STATUS_CLS[smeta.status] || ""}`}>{t(`tender.smeta_status_${smeta.status}`)}</span>
      </header>

      <div className="card p-6 space-y-3">
        <div>
          <p className="text-[12.5px] uppercase tracking-wide text-ink-muted">{t("tender.total_cost")}</p>
          <p className="text-[18px] font-serif">{smeta.total_cost ? Number(smeta.total_cost).toLocaleString() : "—"}</p>
        </div>
        {smeta.ishchi_guruh_note && (
          <div>
            <p className="text-[12.5px] uppercase tracking-wide text-ink-muted">{t("tender.ishchi_guruh_note")}</p>
            <p className="text-[13.5px] text-ink-muted mt-1">{smeta.ishchi_guruh_note}</p>
          </div>
        )}
      </div>

      {isMutaxassis && (smeta.status === "pending_ishchi_guruh" || smeta.status === "ishchi_guruh_rejected") && (
        <div className="card p-6 space-y-4">
          <p className="text-[12.5px] uppercase tracking-wide text-ink-muted flex items-center gap-1.5"><ClipboardCheck size={14} /> {t("tender.ishchi_guruh_action")}</p>
          <textarea className="textarea" rows={3} placeholder={t("tender.register_note")} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <button disabled={ishchiGuruhReview.isPending} onClick={() => ishchiGuruhReview.mutate(false)} className="btn-danger flex-1">
              <Ban size={14} /> {t("tender.reject")}
            </button>
            <button disabled={ishchiGuruhReview.isPending} onClick={() => ishchiGuruhReview.mutate(true)} className="btn-primary flex-1">
              <CheckCircle2 size={14} /> {t("tender.approve")}
            </button>
          </div>
        </div>
      )}

      {isKomissiya && smeta.status === "pending_komissiya" && (
        <div className="card p-6 space-y-4">
          <p className="text-[12.5px] uppercase tracking-wide text-ink-muted">{t("tender.komissiya_final_action")}</p>
          <div className="flex gap-2">
            <button disabled={komissiyaApprove.isPending} onClick={() => komissiyaApprove.mutate(false)} className="btn-danger flex-1">
              <Ban size={14} /> {t("tender.reject")}
            </button>
            <button disabled={komissiyaApprove.isPending} onClick={() => komissiyaApprove.mutate(true)} className="btn-primary flex-1">
              <CheckCircle2 size={14} /> {t("tender.approve")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
