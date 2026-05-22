import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Link } from "react-router-dom";
import { FileUploader } from "@/components/shared/FileUploader";
import { formatDate } from "@/lib/utils";
import type { Document } from "@/types";
import { Trash2 } from "lucide-react";

export function Documents() {
  const qc = useQueryClient();
  const [err, setErr] = useState("");

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ssenariylar</h1>
      <FileUploader onFile={(f) => { setErr(""); upload.mutate(f); }} loading={upload.isPending} />
      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Nomi</th><th>Format</th><th>Hajm</th><th>Status</th><th>Sana</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="p-3"><Link to={`/documents/${d.id}`} className="text-brand hover:underline">{d.title}</Link></td>
                <td className="uppercase">{d.file_type}</td>
                <td>{(d.file_size / 1024 / 1024).toFixed(2)} MB</td>
                <td>{d.status}</td>
                <td>{formatDate(d.created_at)}</td>
                <td>
                  <button onClick={() => confirm("O'chirilsinmi?") && del.mutate(d.id)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
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
