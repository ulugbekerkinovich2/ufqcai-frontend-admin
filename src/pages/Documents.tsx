import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Link } from "react-router-dom";
import { FileUploader } from "@/components/shared/FileUploader";
import { formatDate } from "@/lib/utils";
import type { Document } from "@/types";
import { Trash2, Search, ArrowUpRight, FileText } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  uploaded: { label: "Yuklangan", cls: "bg-surface-sunken text-ink-muted" },
  parsed: { label: "Tayyor", cls: "bg-accent-50 text-accent-700" },
  analyzing: { label: "Tahlilda", cls: "bg-risk-low-bg text-risk-low-fg" },
  done: { label: "Tugagan", cls: "bg-accent-50 text-accent-700" },
  error: { label: "Xato", cls: "bg-risk-high-bg text-risk-high-fg" },
};

export function Documents() {
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");

  const { data: items = [] } = useQuery({
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
    onError: (e: any) => setErr(e.response?.data?.detail || "Yuklash xatosi"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/documents/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const filtered = items.filter((d) =>
    !query || d.title.toLowerCase().includes(query.toLowerCase()) || d.original_name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">Ekspertiza</p>
          <h1 className="font-serif text-[26px] leading-tight">Ssenariylar</h1>
        </div>
        <div className="text-[13px] text-ink-muted">Jami {items.length} ta</div>
      </header>

      <FileUploader onFile={(f) => { setErr(""); upload.mutate(f); }} loading={upload.isPending} />
      {err && <div className="text-sm text-risk-high-fg bg-risk-high-bg/60 px-4 py-2.5 rounded-xl">{err}</div>}

      <div className="card overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-3 border-b border-ink/[0.05]">
          <Search size={16} className="text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nomi yoki fayl bo'yicha qidirish..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-subtle"
          />
          <span className="text-[12px] text-ink-subtle">{filtered.length}</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
              <th className="text-left font-medium px-6 py-3">Nomi</th>
              <th className="text-left font-medium py-3 w-24">Format</th>
              <th className="text-left font-medium py-3 w-24">Hajm</th>
              <th className="text-left font-medium py-3 w-32">Status</th>
              <th className="text-left font-medium py-3 w-40">Sana</th>
              <th className="py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const status = STATUS_MAP[d.status] || { label: d.status, cls: "bg-surface-sunken text-ink-muted" };
              return (
                <tr key={d.id} className="table-row border-t border-ink/[0.05] hover:bg-surface-sunken/50">
                  <td className="px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-surface-sunken text-ink-muted grid place-items-center">
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
                  <td><span className={`chip ${status.cls}`}>{status.label}</span></td>
                  <td className="text-[13px] text-ink-muted">{formatDate(d.created_at)}</td>
                  <td className="pr-6 text-right">
                    <div className="inline-flex gap-0.5">
                      <Link to={`/documents/${d.id}`} className="btn-ghost h-8 w-8 p-0"><ArrowUpRight size={15} /></Link>
                      <button
                        onClick={() => confirm("O'chirilsinmi?") && del.mutate(d.id)}
                        className="btn-ghost h-8 w-8 p-0 hover:text-risk-high-fg"
                      ><Trash2 size={14} strokeWidth={1.75} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-ink-muted text-sm">
                {query ? "Hech narsa topilmadi" : "Hozircha ssenariy yo'q"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
