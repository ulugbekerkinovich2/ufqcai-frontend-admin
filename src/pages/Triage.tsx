import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";
import type { Document } from "@/types";
import { FileText, ArrowUpRight, X, UserCheck, Ban } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { TableSkeleton } from "@/components/shared/Skeleton";

interface Expert {
  id: string;
  full_name: string;
  email: string;
}

export function Triage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [assignDoc, setAssignDoc] = useState<Document | null>(null);
  const [selectedExpert, setSelectedExpert] = useState("");
  const [rejectDoc, setRejectDoc] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["triage-queue"],
    queryFn: async () => (await api.get<Document[]>("/triage/queue")).data,
  });

  const { data: experts = [] } = useQuery({
    queryKey: ["triage-experts"],
    queryFn: async () => (await api.get<Expert[]>("/triage/experts")).data,
  });

  const assign = useMutation({
    mutationFn: async () =>
      (await api.post(`/triage/${assignDoc!.id}/assign`, { expert_id: selectedExpert })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["triage-queue"] });
      setAssignDoc(null);
      setSelectedExpert("");
      toast.success(t("triage.assigned"));
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const reject = useMutation({
    mutationFn: async () =>
      (await api.post(`/triage/${rejectDoc!.id}/reject`, { reason: rejectReason })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["triage-queue"] });
      setRejectDoc(null);
      setRejectReason("");
      toast.success(t("triage.rejected"));
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  return (
    <div className="space-y-7 animate-fade-in">
      <header>
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("triage.section")}</p>
        <h1 className="font-serif text-[26px] leading-tight">{t("triage.title")}</h1>
        <p className="text-[13.5px] text-ink-muted mt-2">{t("triage.hint")}</p>
      </header>

      {items.length === 0 && !isLoading ? (
        <div className="card p-14 flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="h-14 w-14 rounded-2xl bg-surface-sunken text-ink-subtle grid place-items-center">
            <FileText size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-serif text-lg text-ink">{t("triage.empty_title")}</p>
            <p className="text-[13px] text-ink-muted mt-1">{t("triage.empty_hint")}</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                  <th className="text-left font-medium px-6 py-3">{t("documents.col_name")}</th>
                  <th className="text-left font-medium py-3 w-40">{t("documents.col_date")}</th>
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
                        <div>
                          <Link to={`/documents/${d.id}`} className="text-[14px] font-medium text-ink hover:text-accent">{d.title}</Link>
                          <div className="text-[12px] text-ink-subtle">{d.original_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-[13px] text-ink-muted">{formatDate(d.created_at)}</td>
                    <td className="pr-6 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setAssignDoc(d)} className="btn-ghost h-8 px-3 text-[12.5px] text-accent">
                          <UserCheck size={14} /> {t("triage.assign")}
                        </button>
                        <button onClick={() => setRejectDoc(d)} className="btn-ghost h-8 px-3 text-[12.5px] text-risk-high-fg">
                          <Ban size={14} /> {t("triage.reject")}
                        </button>
                        <Link to={`/documents/${d.id}`} className="btn-ghost h-8 w-8 p-0"><ArrowUpRight size={15} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>}
            </table>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignDoc && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-md">
            <div className="px-7 py-5 flex items-center justify-between border-b border-ink/[0.05]">
              <h2 className="font-serif text-xl">{t("triage.assign")}</h2>
              <button onClick={() => setAssignDoc(null)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); assign.mutate(); }} className="p-7 space-y-4">
              <p className="text-[13px] text-ink-muted">{assignDoc.title}</p>
              <div>
                <label className="label">{t("triage.select_expert")}</label>
                <select className="input" required value={selectedExpert} onChange={(e) => setSelectedExpert(e.target.value)}>
                  <option value="" disabled>{t("common.select")}</option>
                  {experts.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.full_name} — {ex.email}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAssignDoc(null)} className="btn-secondary flex-1">{t("common.cancel")}</button>
                <button disabled={assign.isPending || !selectedExpert} className="btn-primary flex-1">
                  {assign.isPending ? t("common.loading") : t("triage.assign")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectDoc && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-md">
            <div className="px-7 py-5 flex items-center justify-between border-b border-ink/[0.05]">
              <h2 className="font-serif text-xl">{t("triage.reject")}</h2>
              <button onClick={() => setRejectDoc(null)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); reject.mutate(); }} className="p-7 space-y-4">
              <p className="text-[13px] text-ink-muted">{rejectDoc.title}</p>
              <div>
                <label className="label">{t("triage.reject_reason")}</label>
                <textarea className="textarea" required rows={3} value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setRejectDoc(null)} className="btn-secondary flex-1">{t("common.cancel")}</button>
                <button disabled={reject.isPending} className="btn-danger flex-1">
                  {reject.isPending ? t("common.loading") : t("triage.reject")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
