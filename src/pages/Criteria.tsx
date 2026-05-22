import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Criterion } from "@/types";
import { Pencil, Plus, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormData {
  name: string;
  description?: string;
  ai_instruction: string;
  weight: string;
  category?: string;
  is_active: boolean;
}

const empty: FormData = {
  name: "", description: "", ai_instruction: "", weight: "1.0", category: "cultural", is_active: true,
};

const CAT_MAP: Record<string, { label: string; cls: string }> = {
  cultural: { label: "Madaniy", cls: "bg-accent-50 text-accent-700" },
  legal: { label: "Huquqiy", cls: "bg-risk-low-bg text-risk-low-fg" },
  content: { label: "Kontent", cls: "bg-risk-medium-bg text-risk-medium-fg" },
};

export function Criteria() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Criterion | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>(empty);
  const [filter, setFilter] = useState<string>("all");

  const { data: items = [] } = useQuery({
    queryKey: ["criteria"],
    queryFn: async () => (await api.get<Criterion[]>("/criteria")).data,
  });

  const save = useMutation({
    mutationFn: async (d: FormData) => {
      const payload = { ...d, weight: Number(d.weight) };
      if (editing) return (await api.patch(`/criteria/${editing.id}`, payload)).data;
      return (await api.post("/criteria", payload)).data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["criteria"] }); setOpen(false); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/criteria/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["criteria"] }),
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(c: Criterion) {
    setEditing(c);
    setForm({
      name: c.name, description: c.description || "", ai_instruction: c.ai_instruction,
      weight: String(c.weight), category: c.category || "", is_active: c.is_active,
    });
    setOpen(true);
  }

  const filtered = items.filter((c) =>
    filter === "all" || filter === "active" ? c.is_active : filter === "inactive" ? !c.is_active : c.category === filter,
  );

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">Sozlamalar</p>
          <h1 className="font-serif text-[34px] leading-tight">Mezonlar</h1>
          <p className="text-[13.5px] text-ink-muted mt-2">Madaniy, huquqiy va kontent mezonlari — AI har tahlilda foydalanadi.</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={16} /> Yangi mezon
        </button>
      </header>

      <div className="flex items-center gap-2">
        {[
          { v: "all", l: "Hammasi" },
          { v: "cultural", l: "Madaniy" },
          { v: "legal", l: "Huquqiy" },
          { v: "content", l: "Kontent" },
          { v: "inactive", l: "Faolsiz" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setFilter(t.v)}
            className={cn(
              "h-9 px-3.5 rounded-xl text-[13px] transition",
              filter === t.v ? "bg-accent text-white" : "bg-surface-raised text-ink-muted hover:text-ink shadow-soft",
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((c) => {
          const cat = CAT_MAP[c.category || ""] || { label: c.category || "—", cls: "bg-surface-sunken text-ink-muted" };
          return (
            <article key={c.id} className="card p-6 card-hover">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-serif text-[18px] leading-tight">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`chip ${cat.cls}`}>{cat.label}</span>
                    {!c.is_active && <span className="chip bg-surface-sunken text-ink-muted">Faolsiz</span>}
                    <span className="text-[12px] text-ink-subtle">v{c.version}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] uppercase tracking-wide text-ink-subtle">Og'irlik</div>
                  <div className="font-serif text-2xl tabular-nums">{Number(c.weight).toFixed(1)}</div>
                </div>
              </div>
              {c.description && (
                <p className="text-[13.5px] text-ink-muted leading-relaxed mb-3 line-clamp-2">{c.description}</p>
              )}
              <p className="text-[12.5px] text-ink-subtle leading-relaxed line-clamp-2 italic">
                "{c.ai_instruction}"
              </p>
              <div className="mt-5 pt-4 surface-divider flex items-center justify-end gap-1">
                <button onClick={() => openEdit(c)} className="btn-ghost h-8 px-2.5 text-[12.5px]">
                  <Pencil size={13} /> Tahrirlash
                </button>
                <button onClick={() => confirm("Faolsizlantirilsinmi?") && del.mutate(c.id)}
                        className="btn-ghost h-8 px-2.5 text-[12.5px] hover:text-risk-high-fg">
                  <Trash2 size={13} /> O'chirish
                </button>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="card p-10 text-center text-ink-muted lg:col-span-2">Hech narsa topilmadi</div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-xl max-h-[92vh] overflow-auto">
            <div className="px-7 py-5 flex items-center justify-between surface-divider border-b">
              <h2 className="font-serif text-xl">{editing ? "Mezonni tahrirlash" : "Yangi mezon"}</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="p-7 space-y-5">
              <div>
                <label className="label">Nomi</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Qisqacha tavsif</label>
                <textarea className="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label">AI uchun ko'rsatma</label>
                <textarea className="textarea" rows={5} required value={form.ai_instruction} onChange={(e) => setForm({ ...form, ai_instruction: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Kategoriya</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="cultural">Madaniy</option>
                    <option value="legal">Huquqiy</option>
                    <option value="content">Kontent</option>
                  </select>
                </div>
                <div>
                  <label className="label">Og'irligi</label>
                  <input type="number" step="0.1" className="input tabular-nums" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                       className="h-4 w-4 rounded accent-accent" />
                <span className="text-sm text-ink">Tahlilda foydalanish (faol)</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Bekor qilish</button>
                <button disabled={save.isPending} className="btn-primary flex-1">
                  {save.isPending ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
