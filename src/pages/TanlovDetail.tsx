import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";
import type { Ariza, Tanlov as TanlovT } from "@/types";
import { ArrowLeft, X, CheckCircle2, Ban, FileCheck2, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/shared/Skeleton";
import { useAuth } from "@/store/auth";

interface Member { id: string; full_name: string; email: string; }

const ARIZA_STATUS_CLS: Record<string, string> = {
  draft: "bg-surface-sunken text-ink-muted",
  submitted: "bg-accent-50 text-accent-700",
  registered: "bg-accent-50 text-accent-700",
  reg_rejected: "bg-risk-high-bg text-risk-high-fg",
  scoring: "bg-risk-medium-bg text-risk-medium-fg",
  winner: "bg-risk-low-bg text-risk-low-fg",
  reserve: "bg-surface-sunken text-ink-muted",
  rejected: "bg-risk-high-bg text-risk-high-fg",
  contracted: "bg-risk-low-bg text-risk-low-fg",
};

export function TanlovDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isMutaxassis = isAdmin || user?.role === "mutaxassis";
  const [showKomissiya, setShowKomissiya] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [registerAriza, setRegisterAriza] = useState<Ariza | null>(null);
  const [registerNote, setRegisterNote] = useState("");

  const { data: tanlov } = useQuery({
    queryKey: ["tanlov", id],
    queryFn: async () => (await api.get<TanlovT>(`/tender/${id}`)).data,
  });

  const { data: arizalar = [], isLoading } = useQuery({
    queryKey: ["tanlov-arizalar", id],
    queryFn: async () => (await api.get<Ariza[]>(`/tender/${id}/arizalar`)).data,
  });

  const { data: komissiya = [] } = useQuery({
    queryKey: ["tanlov-komissiya", id],
    queryFn: async () => (await api.get<Member[]>(`/tender/${id}/komissiya`)).data,
  });

  const { data: allKomissiya = [] } = useQuery({
    queryKey: ["all-komissiya-users"],
    queryFn: async () => (await api.get<Member[]>("/tender/komissiya-users")).data,
    enabled: showKomissiya,
  });

  useEffect(() => {
    if (showKomissiya) setSelectedMembers(komissiya.map((m) => m.id));
  }, [showKomissiya, komissiya]);

  function toggleMember(uid: string) {
    setSelectedMembers((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  }

  const setKomissiya = useMutation({
    mutationFn: async () => (await api.post(`/tender/${id}/komissiya`, { user_ids: selectedMembers })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tanlov-komissiya", id] });
      setShowKomissiya(false);
      toast.success(t("tender.komissiya_set"));
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const register = useMutation({
    mutationFn: async (approve: boolean) =>
      (await api.post(`/tender/arizalar/${registerAriza!.id}/register`, { approve, note: registerNote || null })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tanlov-arizalar", id] });
      setRegisterAriza(null);
      setRegisterNote("");
      toast.success(t("tender.registered"));
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const decide = useMutation({
    mutationFn: async ({ arizaId, outcome }: { arizaId: string; outcome: string }) =>
      (await api.post(`/tender/arizalar/${arizaId}/decide`, { outcome })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tanlov-arizalar", id] }); toast.success(t("tender.decided")); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const contract = useMutation({
    mutationFn: async (arizaId: string) => (await api.post(`/tender/arizalar/${arizaId}/contract`)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tanlov-arizalar", id] }); toast.success(t("tender.contracted")); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  if (!tanlov) {
    return (
      <div className="space-y-7 animate-fade-in">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-96" />
        <div className="card p-6"><Skeleton className="h-24 w-full" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <Link to="/tender" className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> {t("common.back")}
      </Link>

      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("tender.section")}</p>
          <h1 className="font-serif text-[24px] leading-tight">{tanlov.title}</h1>
          {tanlov.description && <p className="text-[13.5px] text-ink-muted mt-2 max-w-xl">{tanlov.description}</p>}
        </div>
        {isAdmin && (
          <button onClick={() => setShowKomissiya(true)} className="btn-secondary h-9 px-4 text-[13px]">
            {t("tender.set_komissiya")} ({komissiya.length})
          </button>
        )}
      </header>

      <div className="card overflow-hidden">
        <div className="px-6 pt-5 pb-4">
          <p className="text-[12.5px] uppercase tracking-wide text-ink-muted">{t("tender.arizalar_title")}</p>
        </div>
        {arizalar.length === 0 && !isLoading ? (
          <div className="px-6 pb-8 text-[13px] text-ink-muted">{t("tender.no_arizalar")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                  <th className="text-left font-medium px-6 py-3">{t("tender.col_organization")}</th>
                  <th className="text-left font-medium py-3 w-32">{t("tender.col_status")}</th>
                  <th className="text-left font-medium py-3 w-40">{t("tender.col_submitted")}</th>
                  <th className="py-3 pr-6"></th>
                </tr>
              </thead>
              <tbody>
                {arizalar.map((a) => (
                  <tr key={a.id} className="border-t border-ink/[0.05] hover:bg-surface-sunken/40">
                    <td className="px-6 py-3 text-[14px] font-medium text-ink">{a.organization_name || "—"}</td>
                    <td className="py-3"><span className={`chip ${ARIZA_STATUS_CLS[a.status] || ""}`}>{t(`tender.ariza_status_${a.status}`)}</span></td>
                    <td className="py-3 text-[13px] text-ink-muted">{a.submitted_at ? formatDate(a.submitted_at) : "—"}</td>
                    <td className="pr-6 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {isMutaxassis && a.status === "submitted" && (
                          <button onClick={() => setRegisterAriza(a)} className="btn-ghost h-8 px-3 text-[12.5px] text-accent">
                            <FileCheck2 size={14} /> {t("tender.register")}
                          </button>
                        )}
                        {isAdmin && a.status === "scoring" && (
                          <>
                            <button onClick={() => decide.mutate({ arizaId: a.id, outcome: "winner" })} className="btn-ghost h-8 px-3 text-[12.5px] text-risk-low-fg">
                              <Trophy size={14} /> {t("tender.mark_winner")}
                            </button>
                            <button onClick={() => decide.mutate({ arizaId: a.id, outcome: "reserve" })} className="btn-ghost h-8 px-3 text-[12.5px] text-ink-muted">
                              {t("tender.mark_reserve")}
                            </button>
                            <button onClick={() => decide.mutate({ arizaId: a.id, outcome: "rejected" })} className="btn-ghost h-8 px-3 text-[12.5px] text-risk-high-fg">
                              <Ban size={14} /> {t("tender.mark_rejected")}
                            </button>
                          </>
                        )}
                        {isAdmin && a.status === "winner" && (
                          <button onClick={() => contract.mutate(a.id)} className="btn-primary h-8 px-3 text-[12.5px]">
                            <CheckCircle2 size={14} /> {t("tender.contract")}
                          </button>
                        )}
                        {a.status === "contracted" && (
                          <Link to={`/rejissorlik-review/${a.id}`} className="btn-ghost h-8 px-3 text-[12.5px] text-accent">
                            {t("tender.rejissorlik_review")}
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showKomissiya && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-md animate-scale-in">
            <div className="px-7 py-5 flex items-center justify-between border-b border-ink/[0.05]">
              <h2 className="font-serif text-xl">{t("tender.set_komissiya")}</h2>
              <button onClick={() => setShowKomissiya(false)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setKomissiya.mutate(); }} className="p-7 space-y-4">
              <div className="max-h-64 overflow-y-auto rounded-xl border border-ink/[0.08] divide-y divide-ink/[0.06]">
                {allKomissiya.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-surface-sunken/50">
                    <input
                      type="checkbox" className="h-4 w-4 accent-accent shrink-0"
                      checked={selectedMembers.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                    />
                    <span className="text-[13px] text-ink">{m.full_name} <span className="text-ink-subtle">— {m.email}</span></span>
                  </label>
                ))}
                {allKomissiya.length === 0 && (
                  <p className="px-3.5 py-4 text-[12.5px] text-ink-subtle">{t("tender.no_komissiya_users")}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowKomissiya(false)} className="btn-secondary flex-1">{t("common.cancel")}</button>
                <button disabled={setKomissiya.isPending || selectedMembers.length === 0} className="btn-primary flex-1">
                  {setKomissiya.isPending ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {registerAriza && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-md animate-scale-in">
            <div className="px-7 py-5 flex items-center justify-between border-b border-ink/[0.05]">
              <h2 className="font-serif text-xl">{t("tender.register")}</h2>
              <button onClick={() => setRegisterAriza(null)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>
            <div className="p-7 space-y-4">
              <p className="text-[13px] text-ink-muted">{registerAriza.organization_name}</p>
              <div>
                <label className="label">{t("tender.register_note")}</label>
                <textarea className="textarea" rows={3} value={registerNote} onChange={(e) => setRegisterNote(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <button disabled={register.isPending} onClick={() => register.mutate(false)} className="btn-danger flex-1">
                  {t("tender.register_reject")}
                </button>
                <button disabled={register.isPending} onClick={() => register.mutate(true)} className="btn-primary flex-1">
                  {t("tender.register_approve")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
