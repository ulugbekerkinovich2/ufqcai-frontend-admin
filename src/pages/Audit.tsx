import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";

interface Row {
  id: number; user_id?: string; action: string; entity: string;
  entity_id?: string; meta?: any; created_at: string;
}

export function Audit() {
  const { data: items = [] } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => (await api.get<Row[]>("/audit")).data,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Vaqt</th><th>User</th><th>Action</th><th>Entity</th><th>Meta</th></tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{formatDate(r.created_at)}</td>
                <td className="font-mono text-xs">{r.user_id?.slice(0, 8)}</td>
                <td>{r.action}</td>
                <td>{r.entity}</td>
                <td className="font-mono text-xs">{r.meta ? JSON.stringify(r.meta) : ""}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-4 text-gray-500">Bo'sh</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
