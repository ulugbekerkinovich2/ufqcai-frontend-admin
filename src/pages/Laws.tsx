import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Law } from "@/types";
import { Trash2, Upload } from "lucide-react";
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Qonunlar bazasi</h1>

      <div className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-3">Yangi qonun yuklash</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (file && title) upload.mutate(); }} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <input className="border rounded px-3 py-2" placeholder="Qonun nomi *" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Hujjat raqami" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Kategoriya" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input type="file" accept=".doc,.docx,.pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} className="md:col-span-2" />
          <button disabled={!file || !title || upload.isPending} className="flex items-center justify-center gap-2 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark disabled:opacity-60">
            <Upload size={16} /> Yuklash & indekslash
          </button>
        </form>
        {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
      </div>

      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Nomi</th><th>Raqam</th><th>Kategoriya</th><th>Faol</th><th>Sana</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3">{l.title}</td>
                <td>{l.doc_number}</td>
                <td>{l.category}</td>
                <td>{l.is_active ? "Ha" : "Yo'q"}</td>
                <td>{formatDate(l.created_at)}</td>
                <td>
                  <button onClick={() => confirm("O'chirilsinmi?") && del.mutate(l.id)} className="text-red-600 p-1 hover:bg-red-50 rounded">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="p-4 text-gray-500">Bo'sh</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
