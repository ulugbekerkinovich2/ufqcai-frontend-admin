import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Analysis, Document } from "@/types";
import { Link } from "react-router-dom";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatDate } from "@/lib/utils";

export function Dashboard() {
  const docsQ = useQuery({
    queryKey: ["dash-docs"],
    queryFn: async () => (await api.get<Document[]>("/documents", { params: { limit: 10 } })).data,
  });

  const items = docsQ.data || [];
  const stats = {
    total: items.length,
    parsed: items.filter((d) => d.status === "parsed" || d.status === "done").length,
    inProgress: items.filter((d) => d.status === "analyzing").length,
  };

  const chartData = [
    { name: "Yuklangan", count: items.filter((d) => d.status === "uploaded").length },
    { name: "Parsed", count: items.filter((d) => d.status === "parsed").length },
    { name: "Tahlilda", count: items.filter((d) => d.status === "analyzing").length },
    { name: "Tugagan", count: items.filter((d) => d.status === "done").length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Jami ssenariylar" value={stats.total} />
        <Card title="Tayyor" value={stats.parsed} />
        <Card title="Tahlilda" value={stats.inProgress} />
      </div>
      <div className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-3">Holat taqsimoti</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1e6091" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded border">
        <div className="px-4 py-3 border-b font-semibold">So'nggi ssenariylar</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Nomi</th><th>Status</th><th>Sana</th></tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="p-3"><Link to={`/documents/${d.id}`} className="text-brand hover:underline">{d.title}</Link></td>
                <td><RiskBadge level={d.status as any} /></td>
                <td>{formatDate(d.created_at)}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="p-4 text-gray-500" colSpan={3}>Hozircha hech narsa yo'q</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white p-4 rounded border">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
