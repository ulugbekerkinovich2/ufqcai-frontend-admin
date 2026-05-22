import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Document, Analysis } from "@/types";
import { formatDate } from "@/lib/utils";

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const docQ = useQuery({
    queryKey: ["doc", id],
    queryFn: async () => (await api.get<Document>(`/documents/${id}`)).data,
  });

  const histQ = useQuery({
    queryKey: ["doc-analyses", id],
    queryFn: async () => (await api.get<Analysis[]>(`/documents/${id}/analyses`)).data,
  });

  const analyze = useMutation({
    mutationFn: async () => (await api.post<Analysis>(`/documents/${id}/analyze`)).data,
    onSuccess: (a) => nav(`/analyses/${a.id}`),
  });

  if (!docQ.data) return <div>Yuklanmoqda...</div>;
  const d = docQ.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{d.title}</h1>
          <div className="text-sm text-gray-500 mt-1">
            {d.original_name} · {d.file_type.toUpperCase()} · {(d.file_size / 1024 / 1024).toFixed(2)} MB
            {d.page_count ? ` · ${d.page_count} sahifa` : ""}
          </div>
        </div>
        <button
          disabled={analyze.isPending || d.status === "error"}
          onClick={() => analyze.mutate()}
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark disabled:opacity-60"
        >
          {analyze.isPending ? "Boshlanmoqda..." : ((histQ.data?.length || 0) > 0 ? "Qayta tahlil qilish" : "Tahlilni ishga tushirish")}
        </button>
      </div>

      <div className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-2">Ssenariy matni</h2>
        <pre className="whitespace-pre-wrap text-sm max-h-[400px] overflow-auto">{d.extracted_text || "(matn yo'q)"}</pre>
      </div>

      <div className="bg-white rounded border">
        <div className="px-4 py-3 border-b font-semibold">Tahlil tarixi</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Sana</th><th>Status</th><th>Ball</th><th>Risk</th><th></th></tr>
          </thead>
          <tbody>
            {(histQ.data || []).map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{formatDate(a.created_at)}</td>
                <td>{a.status}</td>
                <td>{a.overall_score?.toString() || "-"}</td>
                <td>{a.overall_risk || "-"}</td>
                <td><Link className="text-brand hover:underline" to={`/analyses/${a.id}`}>Ko'rish</Link></td>
              </tr>
            ))}
            {(histQ.data || []).length === 0 && <tr><td colSpan={5} className="p-4 text-gray-500">Tahlillar yo'q</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
