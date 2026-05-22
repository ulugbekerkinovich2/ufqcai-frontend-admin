import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";
import { Plus, X } from "lucide-react";

interface User {
  id: string; full_name: string; email: string; role: string; is_active: boolean;
  created_at: string; last_login_at?: string;
}

export function Users() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "admin" });

  const { data: items = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<User[]>("/users")).data,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post("/users", form)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setOpen(false); setForm({ full_name: "", email: "", password: "", role: "admin" }); },
  });

  const toggle = useMutation({
    mutationFn: async (u: User) => (await api.patch(`/users/${u.id}`, { is_active: !u.is_active })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">
          <Plus size={16} /> Yangi admin
        </button>
      </div>

      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Ism</th><th>Email</th><th>Rol</th><th>Faol</th><th>Yaratilgan</th><th>Oxirgi kirish</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.is_active ? "Ha" : "Yo'q"}</td>
                <td>{formatDate(u.created_at)}</td>
                <td>{formatDate(u.last_login_at)}</td>
                <td>
                  <button onClick={() => toggle.mutate(u)} className="text-sm text-brand hover:underline">
                    {u.is_active ? "Faolsizlantirish" : "Faollashtirish"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Yangi admin</h2>
              <button onClick={() => setOpen(false)}><X /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
              <input className="w-full border rounded px-3 py-2" placeholder="To'liq ism" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <input type="email" className="w-full border rounded px-3 py-2" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input type="password" className="w-full border rounded px-3 py-2" placeholder="Parol" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select className="w-full border rounded px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button disabled={create.isPending} className="w-full bg-brand text-white py-2 rounded hover:bg-brand-dark disabled:opacity-60">Yaratish</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
