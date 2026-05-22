import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";
import { Plus, X, ShieldCheck, User as UserIcon } from "lucide-react";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setOpen(false); setForm({ full_name: "", email: "", password: "", role: "admin" });
    },
  });

  const toggle = useMutation({
    mutationFn: async (u: User) => (await api.patch(`/users/${u.id}`, { is_active: !u.is_active })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">Boshqaruv</p>
          <h1 className="font-serif text-[34px] leading-tight">Foydalanuvchilar</h1>
          <p className="text-[13.5px] text-ink-muted mt-2">Tizimdan faqat tasdiqlangan ekspertlar foydalanadi.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus size={16} /> Yangi foydalanuvchi
        </button>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
              <th className="text-left font-medium px-6 py-3">Foydalanuvchi</th>
              <th className="text-left font-medium py-3">Rol</th>
              <th className="text-left font-medium py-3">Status</th>
              <th className="text-left font-medium py-3">Oxirgi kirish</th>
              <th className="text-left font-medium py-3">Yaratilgan</th>
              <th className="py-3 pr-6"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => {
              const initials = u.full_name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
              const isSuper = u.role === "super_admin";
              return (
                <tr key={u.id} className="table-row border-t border-ink/[0.05] hover:bg-surface-sunken/40">
                  <td className="px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-accent/10 text-accent grid place-items-center text-[13px] font-semibold">{initials}</div>
                      <div>
                        <div className="text-[14px] font-medium text-ink">{u.full_name}</div>
                        <div className="text-[12px] text-ink-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`chip ${isSuper ? "bg-accent-50 text-accent-700" : "bg-surface-sunken text-ink-muted"}`}>
                      {isSuper ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                      {isSuper ? "Super Admin" : "Admin"}
                    </span>
                  </td>
                  <td>
                    <span className={`chip ${u.is_active ? "bg-accent-50 text-accent-700" : "bg-risk-high-bg text-risk-high-fg"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-accent" : "bg-risk-high-dot"}`} />
                      {u.is_active ? "Faol" : "Faolsiz"}
                    </span>
                  </td>
                  <td className="text-[13px] text-ink-muted">{u.last_login_at ? formatDate(u.last_login_at) : "—"}</td>
                  <td className="text-[13px] text-ink-muted">{formatDate(u.created_at)}</td>
                  <td className="pr-6 text-right">
                    <button onClick={() => toggle.mutate(u)} className="btn-ghost h-8 px-2.5 text-[12.5px]">
                      {u.is_active ? "Faolsizlantirish" : "Faollashtirish"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-ink-muted text-sm">Foydalanuvchilar yo'q</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-md">
            <div className="px-7 py-5 flex items-center justify-between border-b border-ink/[0.05]">
              <h2 className="font-serif text-xl">Yangi foydalanuvchi</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="p-7 space-y-4">
              <div>
                <label className="label">To'liq ism</label>
                <input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Elektron pochta</label>
                <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Boshlang'ich parol</label>
                <input type="password" className="input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin (ekspert)</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Bekor qilish</button>
                <button disabled={create.isPending} className="btn-primary flex-1">
                  {create.isPending ? "Yaratilmoqda..." : "Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
