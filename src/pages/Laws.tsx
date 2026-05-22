import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Law } from "@/types";
import { Trash2, Upload, BookOpen, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function Laws() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["laws"],
    queryFn: async () => (await api.get<Law[]>("/laws")).data,
  });

  const upload = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("title", title);
      if (docNumber) fd.append("doc_number", docNumber);
      if (category) fd.append("category", category);
      fd.append("file", file!);
      return (await api.post("/laws", fd)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["laws"] });
      setTitle(""); setDocNumber(""); setCategory(""); setFile(null); setErr("");
    },
    onError: (e: any) => setErr(e.response?.data?.detail || "Xato"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/laws/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["laws"] }),
  });

  return (
    <div className="space-y-7 animate-fade-in">
      <header>
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">Bilim bazasi</p>
        <h1 className="font-serif text-[26px] leading-tight">Qonunlar bazasi</h1>
        <p className="text-[13.5px] text-ink-muted mt-2 max-w-2xl">
          Yuklangan qonun matnlari avtomatik <span className="text-ink">parchalanadi</span> va vektor bazaga indekslanadi.
          Tahlil paytida AI ssenariyga semantik mos qonun bo'limlarini topib, huquqiy moslikni baholaydi.
        </p>
      </header>

      <div className="card p-7">
        <h2 className="font-serif text-lg mb-5 flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-xl bg-accent-50 text-accent grid place-items-center">
            <Upload size={15} strokeWidth={1.75} />
          </span>
          Yangi qonun yuklash
        </h2>
        <form onSubmit={(e) => { e.preventDefault(); if (file && title) upload.mutate(); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="label">Qonun nomi *</label>
            <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Kinematografiya to'g'risida" />
          </div>
          <div>
            <label className="label">Hujjat raqami</label>
            <input className="input" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="ORQ-NN" />
          </div>
          <div>
            <label className="label">Kategoriya</label>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Madaniyat / Migratsiya / ..." />
          </div>
          <div className="md:col-span-2">
            <label className="label">Fayl</label>
            <label className="flex items-center gap-3 h-11 px-3.5 rounded-xl bg-surface-sunken cursor-pointer hover:bg-ink/5 transition">
              <Upload size={15} className="text-ink-muted" />
              <span className="text-sm text-ink-muted truncate">{file ? file.name : ".doc, .docx, .pdf, .txt"}</span>
              <input type="file" accept=".doc,.docx,.pdf,.txt" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div className="md:col-span-3 flex items-center justify-between gap-4">
            {err ? (
              <div className="text-sm text-risk-high-fg flex-1">{err}</div>
            ) : <div className="flex-1" />}
            <button disabled={!file || !title || upload.isPending} className="btn-primary">
              <Upload size={15} /> {upload.isPending ? "Indekslanmoqda..." : "Yuklash va indekslash"}
            </button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="font-serif text-lg">Indekslangan qonunlar</h2>
          <span className="text-[12px] text-ink-muted">{items.length} ta</span>
        </div>
        <div className="surface-divider">
          {items.map((l) => (
            <div key={l.id} className="px-6 py-4 border-t border-ink/[0.05] flex items-center gap-4 hover:bg-surface-sunken/40 transition">
              <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent grid place-items-center shrink-0">
                <BookOpen size={16} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-medium text-ink truncate">{l.title}</div>
                <div className="text-[12px] text-ink-muted mt-0.5 flex items-center gap-3">
                  {l.doc_number && <span className="tabular-nums">№ {l.doc_number}</span>}
                  {l.category && <span>· {l.category}</span>}
                  <span>· {formatDate(l.created_at)}</span>
                </div>
              </div>
              {l.is_active && (
                <span className="chip bg-accent-50 text-accent-700">
                  <CheckCircle2 size={12} /> Faol
                </span>
              )}
              <button
                onClick={() => confirm("Bazadan olib tashlansinmi?") && del.mutate(l.id)}
                className="btn-ghost h-9 w-9 p-0 hover:text-risk-high-fg"
              ><Trash2 size={14} strokeWidth={1.75} /></button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="px-6 py-12 text-center text-ink-muted text-sm">Hozircha qonun yuklanmagan</div>
          )}
        </div>
      </div>
    </div>
  );
}
