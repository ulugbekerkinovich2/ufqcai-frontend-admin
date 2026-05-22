import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Criterion } from "@/types";
import { Pencil, Plus, X } from "lucide-react";

interface FormData {
  name: string;
  description?: string;
  ai_instruction: string;
  weight: string;
  category?: string;
  is_active: boolean;
}

const empty: FormData = { name: "", description: "", ai_instruction: "", weight: "1.0", category: "cultural", is_active: true };

export function Criteria() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Criterion | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>(empty);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kriteriyalar</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">
          <Plus size={16} /> Yangi
        </button>
      </div>

      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Nomi</th><th>Kategoriya</th><th>Og'irlik</th><th>Faol</th><th>v</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.description}</div>
                </td>
                <td>{c.category}</td>
                <td>{c.weight?.toString()}</td>
                <td>{c.is_active ? "Ha" : "Yo'q"}</td>
                <td>{c.version}</td>
                <td className="space-x-2">
                  <button onClick={() => openEdit(c)} className="text-brand p-1 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                  <button onClick={() => confirm("O'chirilsinmi?") && del.mutate(c.id)} className="text-red-600 p-1 hover:bg-red-50 rounded"><X size={14} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="p-4 text-gray-500">Bo'sh</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editing ? "Tahrirlash" : "Yangi kriteriya"}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700"><X /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-3">
              <Field label="Nomi"><input className="w-full border rounded px-3 py-2" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Tavsifi"><textarea className="w-full border rounded px-3 py-2" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <Field label="AI ko'rsatma"><textarea className="w-full border rounded px-3 py-2" rows={4} required value={form.ai_instruction} onChange={(e) => setForm({ ...form, ai_instruction: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kategoriya">
                  <select className="w-full border rounded px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="cultural">Madaniy</option>
                    <option value="legal">Huquqiy</option>
                    <option value="content">Kontent</option>
                  </select>
                </Field>
                <Field label="Og'irlik"><input type="number" step="0.1" className="w-full border rounded px-3 py-2" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></Field>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <span className="text-sm">Faol</span>
              </label>
              <button disabled={save.isPending} className="w-full bg-brand text-white py-2 rounded hover:bg-brand-dark disabled:opacity-60">
                {save.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
