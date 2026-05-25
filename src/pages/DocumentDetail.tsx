import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Document, Analysis } from "@/types";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Play, Eye, FileText, AlertCircle } from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/shared/Skeleton";

export function DocumentDetail() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [analyzeErr, setAnalyzeErr] = useState("");

  const docQ = useQuery({
    queryKey: ["doc", id],
    queryFn: async () => (await api.get<Document>(`/documents/${id}`)).data,
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
        <div className="surface-divider">
          <table className="w-full">
            <thead>
              <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                <th className="text-left font-medium px-6 py-3">{t("common.date")}</th>
                <th className="text-left font-medium py-3">{t("common.status")}</th>
                <th className="text-left font-medium py-3">{t("risk.None").split("'")[0]}</th>
                <th className="text-left font-medium py-3">{t("analysis.score")}</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {history.map((a) => (
                <tr key={a.id} className="table-row border-t border-ink/[0.05] hover:bg-surface-sunken/50">
                  <td className="px-6 text-[13.5px] text-ink">{formatDate(a.created_at)}</td>
                  <td><span className="chip bg-surface-sunken text-ink-muted">{t(`status.${a.status}`)}</span></td>
                  <td>{a.overall_risk ? <RiskBadge level={a.overall_risk} /> : <span className="text-ink-subtle text-sm">—</span>}</td>
                  <td className="text-[14px] font-serif tabular-nums">{a.overall_score?.toString() || "—"}</td>
                  <td className="pr-6 text-right">
                    <Link to={`/analyses/${a.id}`} className="btn-ghost h-8 px-2.5 text-[12.5px]">
                      <Eye size={14} /> {t("common.view")}
                    </Link>
                  </td>
                </tr>
              ))}
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
