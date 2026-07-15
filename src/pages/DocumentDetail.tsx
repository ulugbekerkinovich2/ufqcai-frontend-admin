import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/store/auth";
import type { Document, Analysis } from "@/types";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Play, Eye, FileText, AlertCircle, UserCog, X } from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { ReviewStatusBadge } from "@/components/shared/ReviewStatusBadge";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/shared/Skeleton";
import { toast } from "@/lib/toast";

interface Expert { id: string; full_name: string; email: string; }

export function DocumentDetail() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [analyzeErr, setAnalyzeErr] = useState("");
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignExperts, setReassignExperts] = useState<string[]>([]);

  const isMutaxassis = ["mutaxassis", "admin", "super_admin"].includes(user?.role ?? "");

  const docQ = useQuery({
    queryKey: ["doc", id],
    queryFn: async () => (await api.get<Document>(`/documents/${id}`)).data,
  });

  const { data: experts = [] } = useQuery({
    queryKey: ["triage-experts"],
    queryFn: async () => (await api.get<Expert[]>("/triage/experts")).data,
    enabled: isMutaxassis && reassignOpen,
  });

  const { data: currentExperts = [] } = useQuery({
    queryKey: ["doc-experts", id],
    queryFn: async () => (await api.get<Expert[]>(`/triage/${id}/experts`)).data,
    enabled: isMutaxassis && reassignOpen,
  });

  useEffect(() => {
    if (reassignOpen) setReassignExperts(currentExperts.map((e) => e.id));
  }, [reassignOpen, currentExperts]);

  function toggleReassignExpert(expId: string) {
    setReassignExperts((prev) => (prev.includes(expId) ? prev.filter((x) => x !== expId) : [...prev, expId]));
  }

  const reassign = useMutation({
    mutationFn: async () => (await api.post(`/triage/${id}/reassign`, { expert_ids: reassignExperts })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc", id] });
      qc.invalidateQueries({ queryKey: ["doc-experts", id] });
      setReassignOpen(false);
      setReassignExperts([]);
      toast.success(t("triage.assigned"));
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || t("common.error")),
  });

  const histQ = useQuery({
    queryKey: ["doc-analyses", id],
    queryFn: async () => (await api.get<Analysis[]>(`/documents/${id}/analyses`)).data,
    staleTime: 0,
    refetchInterval: (q) => {
      const hasRunning = q.state.data?.some(
        (a) => a.status === "pending" || a.status === "running",
      );
      return hasRunning ? 3000 : false;
    },
  });

  const analyze = useMutation({
    mutationFn: async () => (await api.post<Analysis>(`/documents/${id}/analyze`)).data,
    onSuccess: (a) => { setAnalyzeErr(""); nav(`/analyses/${a.id}`); },
    onError: (e: any) => {
      const code: string = e?.response?.data?.detail || "";
      setAnalyzeErr(t(`quota.${code}`) || t("common.error"));
    },
  });

  if (docQ.isLoading) return (
    <div className="space-y-7 animate-fade-in">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="card p-7 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="card p-7 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
  if (!docQ.data) return <div className="text-ink-muted text-sm p-6">{t("common.error")}</div>;
  const d = docQ.data;
  const history = histQ.data || [];

  return (
    <div className="space-y-7 animate-fade-in">
      <Link to="/documents" className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> {t("doc.back")}
      </Link>

      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("doc.section")}</p>
          <h1 className="font-serif text-[24px] leading-tight text-balance">{d.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-[13px] text-ink-muted">
            <ReviewStatusBadge status={d.review_status} />
            <span className="inline-flex items-center gap-1.5"><FileText size={13} /> {d.original_name}</span>
            <span>·</span>
            <span className="uppercase tabular-nums">{d.file_type}</span>
            <span>·</span>
            <span className="tabular-nums">{(d.file_size / 1024 / 1024).toFixed(2)} MB</span>
            {d.page_count ? <><span>·</span><span className="tabular-nums">{d.page_count} sahifa</span></> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            disabled={analyze.isPending || d.status === "error"}
            onClick={() => analyze.mutate()}
            className="btn-primary shrink-0"
          >
            <Play size={15} strokeWidth={2} fill="currentColor" />
            {analyze.isPending ? t("doc.starting") : history.length > 0 ? t("doc.reanalyze") : t("doc.analyze")}
          </button>
          {analyzeErr && (
            <div className="flex items-center gap-1.5 text-[12.5px] text-risk-high-fg animate-fade-in">
              <AlertCircle size={13} className="shrink-0" />
              {analyzeErr}
            </div>
          )}
        </div>
      </header>

      {(d.review_status === "assigned" || d.review_status === "evaluated") && isMutaxassis && (
        <div className="card p-5 flex items-center justify-between gap-4">
          <p className="text-[13px] text-ink-muted">{t("triage.reassign_hint")}</p>
          <button onClick={() => setReassignOpen(true)} className="btn-secondary shrink-0">
            <UserCog size={15} /> {t("triage.reassign")}
          </button>
        </div>
      )}

      {reassignOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-md animate-scale-in">
            <div className="px-7 py-5 flex items-center justify-between border-b border-ink/[0.05]">
              <h2 className="font-serif text-xl">{t("triage.reassign")}</h2>
              <button onClick={() => setReassignOpen(false)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); reassign.mutate(); }} className="p-7 space-y-4">
              <div>
                <label className="label mb-2 block">{t("triage.select_expert")}</label>
                <p className="text-[11.5px] text-ink-subtle mb-2">{t("triage.select_expert_hint")}</p>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-ink/[0.08] divide-y divide-ink/[0.06]">
                  {experts.map((ex) => (
                    <label key={ex.id} className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-surface-sunken/50">
                      <input
                        type="checkbox" className="h-4 w-4 accent-accent shrink-0"
                        checked={reassignExperts.includes(ex.id)}
                        onChange={() => toggleReassignExpert(ex.id)}
                      />
                      <span className="text-[13px] text-ink">{ex.full_name} <span className="text-ink-subtle">— {ex.email}</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setReassignOpen(false)} className="btn-secondary flex-1">{t("common.cancel")}</button>
                <button disabled={reassign.isPending || reassignExperts.length === 0} className="btn-primary flex-1">
                  {reassign.isPending ? t("common.loading") : t("triage.reassign")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {d.review_status === "rejected" && d.reject_reason && (
        <div className="card p-6 border border-risk-high-bg">
          <p className="text-[12.5px] uppercase tracking-wide text-ink-muted mb-1">{t("triage.reject_reason")}</p>
          <p className="text-[14px] text-ink">{d.reject_reason}</p>
        </div>
      )}

      <div className="card p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg">{t("doc.text")}</h2>
          <span className="text-[12px] text-ink-subtle">
            {(d.extracted_text || "").length.toLocaleString()}
          </span>
        </div>
        <div className="bg-surface rounded-xl p-5 max-h-[460px] overflow-auto">
          <pre className="whitespace-pre-wrap text-[14px] font-sans leading-[1.85] text-ink">
            {d.extracted_text || <span className="text-ink-subtle">{t("doc.text_empty")}</span>}
          </pre>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="font-serif text-lg">{t("doc.history")}</h2>
          <span className="text-[12px] text-ink-muted">{history.length}</span>
        </div>
        <div className="surface-divider overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                <th className="text-left font-medium px-6 py-3">{t("common.date")}</th>
                <th className="text-left font-medium py-3">{t("common.status")}</th>
                <th className="text-left font-medium py-3">{t("expert.col_risk")}</th>
                <th className="text-left font-medium py-3">{t("analysis.score")}</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {history.map((a) => {
                const inProgress = a.status === "pending" || a.status === "running";
                return (
                  <tr key={a.id} className="table-row border-t border-ink/[0.05] hover:bg-surface-sunken/50">
                    <td className="px-6 text-[13.5px] text-ink">{formatDate(a.created_at)}</td>
                    <td>
                      {inProgress ? (
                        <div className="min-w-[9rem]">
                          <div className="flex items-center gap-2 text-[12px] text-accent">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft shrink-0" />
                            <span className="truncate">{t(`status.${a.status}`)}</span>
                            {typeof a.progress_percent === "number" && (
                              <span className="font-mono tabular-nums text-ink-muted shrink-0">{a.progress_percent}%</span>
                            )}
                          </div>
                          <div className="h-1 w-full bg-surface-sunken rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-accent rounded-full"
                              style={{ width: `${a.progress_percent ?? 0}%`, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="chip bg-surface-sunken text-ink-muted">{t(`status.${a.status}`)}</span>
                      )}
                    </td>
                    <td>{a.overall_risk ? <RiskBadge level={a.overall_risk} /> : <span className="text-ink-subtle text-sm">—</span>}</td>
                    <td className="text-[14px] font-serif tabular-nums">{a.overall_score?.toString() || "—"}</td>
                    <td className="pr-6 text-right">
                      <Link to={`/analyses/${a.id}`} className="btn-ghost h-8 px-2.5 text-[12.5px]">
                        <Eye size={14} /> {t("common.view")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-ink-muted text-sm">{t("common.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
