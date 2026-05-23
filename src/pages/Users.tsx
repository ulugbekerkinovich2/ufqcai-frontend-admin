import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";
import { Plus, X, ShieldCheck, User as UserIcon, Pencil, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface User {
  id: string; full_name: string; email: string; role: string; is_active: boolean;
  created_at: string; last_login_at?: string; daily_token_limit?: number;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function Users() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "admin" });
  const [editLimitId, setEditLimitId] = useState<string | null>(null);
  const [limitVal, setLimitVal] = useState<string>("");

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

  const updateLimit = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) =>
      (await api.patch(`/users/${id}`, { daily_token_limit: value })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditLimitId(null);
      setLimitVal("");
    },
  });

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("users.section")}</p>
          <h1 className="font-serif text-[26px] leading-tight">{t("users.title")}</h1>
          <p className="text-[13.5px] text-ink-muted mt-2">{t("users.hint")}</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus size={16} /> {t("users.new")}
        </button>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
              <th className="text-left font-medium px-6 py-3">{t("users.title")}</th>
              <th className="text-left font-medium py-3">{t("users.role")}</th>
              <th className="text-left font-medium py-3">{t("common.status")}</th>
              <th className="text-left font-medium py-3">{t("users.last_login")}</th>
              <th className="text-left font-medium py-3">{t("users.created")}</th>
              <th className="text-left font-medium py-3">{t("users.token_limit")}</th>
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
                      {isSuper ? t("users.role_super") : "Admin"}
                    </span>
                  </td>
                  <td>
                    <span className={`chip ${u.is_active ? "bg-accent-50 text-accent-700" : "bg-risk-high-bg text-risk-high-fg"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-accent" : "bg-risk-high-dot"}`} />
                      {u.is_active ? t("users.active") : t("users.inactive")}
                    </span>
                  </td>
                  <td className="text-[13px] text-ink-muted">{u.last_login_at ? formatDate(u.last_login_at) : "—"}</td>
                  <td className="text-[13px] text-ink-muted">{formatDate(u.created_at)}</td>
                  <td className="text-[13px]">
                    {editLimitId === u.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          className="input h-7 w-28 text-[12px] px-2"
                          value={limitVal}
                          onChange={(e) => setLimitVal(e.target.value)}
                          autoFocus
                        />
                        <button
                          className="btn-ghost h-7 w-7 p-0 text-accent"
                          onClick={() => updateLimit.mutate({ id: u.id, value: parseInt(limitVal || "0", 10) })}
                          disabled={updateLimit.isPending}
                        >
                          <Check size={13} />
                        </button>
                        <button
                          className="btn-ghost h-7 w-7 p-0"
                          onClick={() => { setEditLimitId(null); setLimitVal(""); }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-ink-muted">
                          {u.daily_token_limit && u.daily_token_limit > 0
                            ? formatNumber(u.daily_token_limit)
                            : t("users.global_limit")}
                        </span>
                        <button
                          className="btn-ghost h-6 w-6 p-0 opacity-40 hover:opacity-100"
                          onClick={() => {
                            setEditLimitId(u.id);
                            setLimitVal(String(u.daily_token_limit ?? 0));
                          }}
                        >
                          <Pencil size={11} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="pr-6 text-right">
                    <button onClick={() => toggle.mutate(u)} className="btn-ghost h-8 px-2.5 text-[12.5px]">
                      {u.is_active ? t("users.deactivate") : t("users.activate")}
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-ink-muted text-sm">{t("common.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Permissions section */}
      <div className="card p-6 space-y-4">
        <h2 className="font-serif text-[18px]">{t("users.permissions")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-ink/[0.07] bg-surface-sunken/40 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <UserIcon size={15} className="text-ink-muted" />
              <span className="text-[13.5px] font-semibold text-ink">{t("users.role_admin")}</span>
            </div>
            <p className="text-[12.5px] text-ink-muted leading-relaxed">{t("users.perm_admin_can")}</p>
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-accent" />
              <span className="text-[13.5px] font-semibold text-ink">{t("users.role_super")}</span>
            </div>
            <p className="text-[12.5px] text-ink-muted leading-relaxed">{t("users.perm_super_can")}</p>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-md">
            <div className="px-7 py-5 flex items-center justify-between border-b border-ink/[0.05]">
              <h2 className="font-serif text-xl">{t("users.new")}</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="p-7 space-y-4">
              <div>
                <label className="label">{t("users.full_name")}</label>
                <input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">{t("auth.email")}</label>
                <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">{t("users.initial_password")}</label>
                <input type="password" className="input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="label">{t("users.role")}</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">{t("users.role_admin")}</option>
                  <option value="super_admin">{t("users.role_super")}</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">{t("common.cancel")}</button>
                <button disabled={create.isPending} className="btn-primary flex-1">
                  {create.isPending ? t("common.loading") : t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
