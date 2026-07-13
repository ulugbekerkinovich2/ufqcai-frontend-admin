import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Link } from "react-router-dom";
import { FileUploader } from "@/components/shared/FileUploader";
import { formatDate } from "@/lib/utils";
import type { Document } from "@/types";
import { Trash2, Search, ArrowUpRight, FileText, CheckSquare, Upload, ArrowUpDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { confirm } from "@/components/shared/ConfirmDialog";
import { toast } from "@/lib/toast";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { ReviewStatusBadge } from "@/components/shared/ReviewStatusBadge";

const STATUS_CLS: Record<string, string> = {
  uploaded: "bg-surface-sunken text-ink-muted",
  parsed: "bg-accent-50 text-accent-700",
  analyzing: "bg-risk-low-bg text-risk-low-fg",
  done: "bg-accent-50 text-accent-700",
  completed: "bg-accent-50 text-accent-700",
  error: "bg-risk-high-bg text-risk-high-fg",
};

type SortKey = "date_desc" | "date_asc" | "name_asc" | "size_desc";

const SORT_OPTIONS: { v: SortKey; label: string }[] = [
  { v: "date_desc", label: "Yangi" },
  { v: "date_asc",  label: "Eski" },
  { v: "name_asc",  label: "A–Z" },
  { v: "size_desc", label: "Hajm" },
];

function sortItems(items: Document[], sort: SortKey): Document[] {
  return [...items].sort((a, b) => {
    if (sort === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "date_asc")  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === "name_asc")  return a.title.localeCompare(b.title);
    if (sort === "size_desc") return b.file_size - a.file_size;
    return 0;
  });
}

export function Documents() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => (await api.get<Document[]>("/documents")).data,
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name);
      const { data } = await api.post("/documents", fd);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success(t("documents.upload_success"));
    },
    onError: (e: any) => setErr(e.response?.data?.detail || "Yuklash xatosi"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/documents/${id}`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success(t("documents.deleted"));
    },
    onError: () => toast.error(t("common.error")),
  });

  const statuses = ["all", ...Array.from(new Set(items.map((d) => d.status)))];

  const filtered = sortItems(
    items.filter((d) => {
      const matchQ = !query || d.title.toLowerCase().includes(query.toLowerCase()) || d.original_name.toLowerCase().includes(query.toLowerCase());
      const matchS = statusFilter === "all" || d.status === statusFilter;
      return matchQ && matchS;
    }),
    sort,
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every((d) => selected.has(d.id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((d) => d.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkDelete() {
    const ok = await confirm({ message: t("documents.bulk_delete_confirm", { n: selected.size }), confirmLabel: t("documents.bulk_delete") });
    if (!ok) return;
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map((id) => api.delete(`/documents/${id}`)));
      const n = selected.size;
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success(t("documents.bulk_deleted", { n }));
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("documents.section")}</p>
          <h1 className="font-serif text-[26px] leading-tight">{t("documents.title")}</h1>
        </div>
        <div className="text-[13px] text-ink-muted">{t("documents.total", { n: items.length })}</div>
      </header>

      <FileUploader onFile={(f) => { setErr(""); upload.mutate(f); }} loading={upload.isPending} />
      {err && <div className="text-sm text-risk-high-fg bg-risk-high-bg/60 px-4 py-2.5 rounded-xl">{err}</div>}

      {items.length === 0 && !upload.isPending ? (
        <div className="card p-14 flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="h-14 w-14 rounded-2xl bg-surface-sunken text-ink-subtle grid place-items-center">
            <Upload size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-serif text-lg text-ink">{t("documents.empty_title")}</p>
            <p className="text-[13px] text-ink-muted mt-1">{t("documents.empty_hint")}</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* toolbar */}
          <div className="px-6 py-4 flex items-center gap-3 border-b border-ink/[0.05] flex-wrap">
            <Search size={16} className="text-ink-subtle shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("documents.search")}
              className="flex-1 min-w-[140px] bg-transparent outline-none text-sm placeholder:text-ink-subtle"
            />
            {/* status filter chips */}
            <div className="flex items-center gap-1.5">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "h-7 px-3 rounded-lg text-[12px] transition",
                    statusFilter === s
                      ? "bg-accent text-white"
                      : "bg-surface-sunken text-ink-muted hover:text-ink",
                  )}
                >
                  {s === "all" ? t("common.all") : t(`status.${s}`)}
                </button>
              ))}
            </div>
            {/* sort */}
            <div className="flex items-center gap-1 text-ink-muted">
              <ArrowUpDown size={13} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="bg-transparent text-[12.5px] outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.v} value={o.v}>{o.label}</option>
                ))}
              </select>
            </div>
            <span className="text-[12px] text-ink-subtle">{filtered.length}</span>
          </div>

          {someSelected && (
            <div className="px-6 py-3 flex items-center gap-3 bg-accent-50 border-b border-accent/20">
              <CheckSquare size={15} className="text-accent-700" />
              <span className="text-[13px] text-accent-700 font-medium flex-1">
                {t("documents.selected_count", { n: selected.size })}
              </span>
              <button
                onClick={bulkDelete}
                disabled={bulkDeleting}
                className="btn-ghost h-8 px-3 text-[12.5px] text-risk-high-fg hover:bg-risk-high-bg/40 disabled:opacity-50"
              >
                <Trash2 size={13} strokeWidth={1.75} />
                {bulkDeleting ? t("common.deleting") : t("documents.bulk_delete")}
              </button>
              <button onClick={() => setSelected(new Set())} className="btn-ghost h-8 px-3 text-[12.5px]">
                {t("common.cancel")}
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
                <th className="px-6 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 accent-accent cursor-pointer"
                  />
                </th>
                <th className="text-left font-medium py-3">{t("documents.col_name")}</th>
                <th className="text-left font-medium py-3 w-24">{t("documents.col_format")}</th>
                <th className="text-left font-medium py-3 w-24">{t("documents.col_size")}</th>
                <th className="text-left font-medium py-3 w-32">{t("documents.col_status")}</th>
                <th className="text-left font-medium py-3 w-36">{t("documents.col_review_status")}</th>
                <th className="text-left font-medium py-3 w-40">{t("documents.col_date")}</th>
                <th className="py-3 w-20"></th>
              </tr>
            </thead>
            {isLoading ? <TableSkeleton rows={4} cols={8} /> : <tbody>
              {filtered.map((d, i) => {
                const cls = STATUS_CLS[d.status] || "bg-surface-sunken text-ink-muted";
                const label = t(`status.${d.status}`);
                const isChecked = selected.has(d.id);
                return (
                  <tr
                    key={d.id}
                    className={`table-row border-t border-ink/[0.05] hover:bg-surface-sunken/50 animate-fade-in ${isChecked ? "bg-accent-50/40" : ""}`}
                    style={{ animationDelay: `${Math.min(i, 12) * 35}ms`, animationFillMode: "backwards" }}
                  >
                    <td className="px-6">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(d.id)}
                        className="h-3.5 w-3.5 accent-accent cursor-pointer"
                      />
                    </td>
                    <td>
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
                    <td className="text-[13px] uppercase text-ink-muted tabular-nums">{d.file_type}</td>
                    <td className="text-[13px] text-ink-muted tabular-nums">{(d.file_size / 1024 / 1024).toFixed(2)} MB</td>
                    <td><span className={`chip ${cls}`}>{label}</span></td>
                    <td><ReviewStatusBadge status={d.review_status} /></td>
                    <td className="text-[13px] text-ink-muted">{formatDate(d.created_at)}</td>
                    <td className="pr-6 text-right">
                      <div className="inline-flex gap-0.5">
                        <Link to={`/documents/${d.id}`} className="btn-ghost h-8 w-8 p-0"><ArrowUpRight size={15} /></Link>
                        <button
                          onClick={async () => { if (await confirm({ message: t("common.confirm_delete") })) del.mutate(d.id); }}
                          className="btn-ghost h-8 w-8 p-0 hover:text-risk-high-fg"
                        ><Trash2 size={14} strokeWidth={1.75} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-ink-muted">
                      <Search size={20} strokeWidth={1.5} className="text-ink-subtle" />
                      <span className="text-sm">{t("documents.no_results")}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>}
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
