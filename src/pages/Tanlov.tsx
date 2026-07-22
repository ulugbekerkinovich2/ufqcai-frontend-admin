import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";
import type { Tanlov as TanlovT } from "@/types";
import { Gavel, ArrowUpRight, X, Plus, Lock, Ban } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { confirm } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { useAuth } from "@/store/auth";

const STATUS_CLS: Record<string, string> = {
  draft: "bg-surface-sunken text-ink-muted",
  announced: "bg-accent-50 text-accent-700",
  intake_closed: "bg-risk-medium-bg text-risk-medium-fg",
  completed: "bg-risk-low-bg text-risk-low-fg",
  cancelled: "bg-risk-high-bg text-risk-high-fg",
};

export function Tanlov() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filmType, setFilmType] = useState("toliq_metrajli");
  const [deadline, setDeadline] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["tanlovlar"],
    queryFn: async () => (await api.get<TanlovT[]>("/tender")).data,
  });

  const create = useMutation({
    mutationFn: async () =>
      (await api.post("/tender", {
        title, description: description || null, film_type: filmType,
        application_deadline: deadline ? new Date(deadline).toISOString() : null,
      })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tanlovlar"] });
      setShowCreate(false);
      setTitle(""); setDescription(""); setDeadline("");
      toast.success(t("tender.announced"));
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const closeIntake = useMutation({
    mutationFn: async (id: string) => (await api.post(`/tender/${id}/close-intake`)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tanlovlar"] }); toast.success(t("tender.intake_closed")); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => (await api.post(`/tender/${id}/cancel`)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tanlovlar"] }); toast.success(t("tender.cancelled")); },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  async function handleCancel(id: string) {
    if (await confirm({ title: t("tender.cancel_confirm_title"), message: t("tender.cancel_confirm_message") })) {
      cancel.mutate(id);
    }
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("tender.section")}</p>
          <h1 className="font-serif text-[26px] leading-tight">{t("tender.title")}</h1>
          <p className="text-[13.5px] text-ink-muted mt-2">{t("tender.hint")}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary h-9 px-4 text-[13px]">
            <Plus size={15} /> {t("tender.announce")}
          </button>
        )}
      </header>

      {items.length === 0 && !isLoading ? (
        <div className="card p-14 flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="h-14 w-14 rounded-2xl bg-surface-sunken text-ink-subtle grid place-items-center">
            <Gavel size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-serif text-lg text-ink">{t("tender.empty_title")}</p>
            <p className="text-[13px] text-ink-muted mt-1">{t("tender.empty_hint")}</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                  <th className="text-left font-medium px-6 py-3">{t("tender.col_title")}</th>
                  <th className="text-left font-medium py-3 w-32">{t("tender.col_status")}</th>
                  <th className="text-left font-medium py-3 w-40">{t("tender.col_deadline")}</th>
                  <th className="py-3 pr-6"></th>
                </tr>
              </thead>
              {isLoading ? <TableSkeleton rows={4} cols={4} /> : <tbody>
                {items.map((tv) => (
                  <tr key={tv.id} className="border-t border-ink/[0.05] hover:bg-surface-sunken/40">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-surface-sunken text-ink-muted grid place-items-center shrink-0">
                          <Gavel size={14} strokeWidth={1.75} />
                        </div>
                        <div>
                          <Link to={`/tender/${tv.id}`} className="text-[14px] font-medium text-ink hover:text-accent">{tv.title}</Link>
                          {tv.film_type && <div className="text-[12px] text-ink-subtle">{t(`tender.film_type_${tv.film_type}`)}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`chip ${STATUS_CLS[tv.status] || STATUS_CLS.draft}`}>{t(`tender.status_${tv.status}`)}</span>
                    </td>
                    <td className="py-3 text-[13px] text-ink-muted">{tv.application_deadline ? formatDate(tv.application_deadline) : "—"}</td>
                    <td className="pr-6 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {isAdmin && tv.status === "announced" && (
                          <button onClick={() => closeIntake.mutate(tv.id)} className="btn-ghost h-8 px-3 text-[12.5px] text-risk-medium-fg">
                            <Lock size={14} /> {t("tender.close_intake")}
                          </button>
                        )}
                        {isAdmin && tv.status !== "completed" && tv.status !== "cancelled" && (
                          <button onClick={() => handleCancel(tv.id)} className="btn-ghost h-8 px-3 text-[12.5px] text-risk-high-fg">
                            <Ban size={14} /> {t("tender.cancel")}
                          </button>
                        )}
                        <Link to={`/tender/${tv.id}`} className="btn-ghost h-8 w-8 p-0"><ArrowUpRight size={15} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>}
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-md animate-scale-in">
            <div className="px-7 py-5 flex items-center justify-between border-b border-ink/[0.05]">
              <h2 className="font-serif text-xl">{t("tender.announce")}</h2>
              <button onClick={() => setShowCreate(false)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="p-7 space-y-4">
              <div>
                <label className="label">{t("tender.field_title")}</label>
                <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">{t("tender.field_film_type")}</label>
                <select className="input" value={filmType} onChange={(e) => setFilmType(e.target.value)}>
                  <option value="toliq_metrajli">{t("tender.film_type_toliq_metrajli")}</option>
                  <option value="qisqa_metrajli">{t("tender.film_type_qisqa_metrajli")}</option>
                  <option value="hujjatli">{t("tender.film_type_hujjatli")}</option>
                  <option value="animatsion">{t("tender.film_type_animatsion")}</option>
                </select>
              </div>
              <div>
                <label className="label">{t("tender.field_description")}</label>
                <textarea className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="label">{t("tender.field_deadline")}</label>
                <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">{t("common.cancel")}</button>
                <button disabled={create.isPending || !title.trim()} className="btn-primary flex-1">
                  {create.isPending ? t("common.loading") : t("tender.announce")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
