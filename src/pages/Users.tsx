import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";
import { Plus, X, ShieldCheck, User as UserIcon, Eye, Pencil, Check, Trash2, KeyRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface UserData {
  id: string; full_name: string; email: string; role: string; is_active: boolean;
  created_at: string; last_login_at?: string; daily_token_limit?: number;
  permissions: string[];
}

const ALL_PERMS = [
  "trigger_analysis",
  "upload_document",
  "edit_criteria",
  "upload_law",
  "delete_document",
  "manage_users",
  "view_usage",
  "view_audit",
] as const;

const ROLE_PERMS: Record<string, string[]> = {
  super_admin: [...ALL_PERMS],
  admin: ["trigger_analysis", "upload_document", "edit_criteria", "upload_law", "delete_document"],
  viewer: [],
};

function roleGrantsPerm(role: string, perm: string) {
  return (ROLE_PERMS[role] ?? []).includes(perm);
}

function RoleBadge({ role }: { role: string }) {
  const { t } = useI18n();
  if (role === "super_admin")
    return (
      <span className="chip bg-accent-50 text-accent-700">
        <ShieldCheck size={12} /> {t("users.role_super")}
      </span>
    );
  if (role === "admin")
    return (
      <span className="chip bg-risk-medium-bg text-risk-medium-fg">
        <UserIcon size={12} /> {t("users.role_admin")}
      </span>
    );
  return (
    <span className="chip bg-surface-sunken text-ink-muted">
      <Eye size={12} /> {t("users.role_viewer")}
    </span>
  );
}

export function Users() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: "", email: "", password: "", role: "viewer" });

  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [resetPwd, setResetPwd] = useState("");
  const [editTokenLimit, setEditTokenLimit] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<UserData[]>("/users")).data,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post("/users", createForm)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
      setCreateForm({ full_name: "", email: "", password: "", role: "viewer" });
    },
  });

  const update = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.patch(`/users/${editUser!.id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditUser(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (u: UserData) =>
      (await api.patch(`/users/${u.id}`, { is_active: !u.is_active })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  function openEdit(u: UserData) {
    setEditUser(u);
    setEditRole(u.role);
    setEditPerms(u.permissions ?? []);
    setEditName(u.full_name);
    setResetPwd("");
    setEditTokenLimit(String(u.daily_token_limit ?? 0));
  }

  function togglePerm(perm: string) {
    setEditPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  }

  function saveEdit() {
    const payload: Record<string, unknown> = {
      full_name: editName,
      role: editRole,
      permissions: editPerms,
      daily_token_limit: parseInt(editTokenLimit || "0", 10),
    };
    if (resetPwd.trim()) payload.password = resetPwd.trim();
    update.mutate(payload);
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("users.section")}</p>
          <h1 className="font-serif text-[26px] leading-tight">{t("users.title")}</h1>
          <p className="text-[13.5px] text-ink-muted mt-2">{t("users.hint")}</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={16} /> {t("users.new")}
        </button>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[12px] uppercase tracking-wide text-ink-muted">
              <th className="text-left font-medium px-6 py-3">{t("users.full_name")}</th>
              <th className="text-left font-medium py-3">{t("users.role")}</th>
              <th className="text-left font-medium py-3">{t("common.status")}</th>
              <th className="text-left font-medium py-3">{t("users.last_login")}</th>
              <th className="text-left font-medium py-3">{t("users.token_limit")}</th>
              <th className="py-3 pr-6"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => {
              const initials = u.full_name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
              return (
                <tr key={u.id} className="border-t border-ink/[0.05] hover:bg-surface-sunken/40">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-accent/10 text-accent grid place-items-center text-[13px] font-semibold shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-ink">{u.full_name}</div>
                        <div className="text-[12px] text-ink-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3"><RoleBadge role={u.role} /></td>
                  <td className="py-3">
                    <span className={`chip ${u.is_active ? "bg-accent-50 text-accent-700" : "bg-risk-high-bg text-risk-high-fg"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-accent" : "bg-risk-high-dot"}`} />
                      {u.is_active ? t("users.active") : t("users.inactive")}
                    </span>
                  </td>
                  <td className="py-3 text-[13px] text-ink-muted">
                    {u.last_login_at ? formatDate(u.last_login_at) : "—"}
                  </td>
                  <td className="py-3 text-[13px] text-ink-muted">
                    {u.daily_token_limit && u.daily_token_limit > 0
                      ? u.daily_token_limit.toLocaleString()
                      : t("users.global_limit")}
                  </td>
                  <td className="pr-6 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(u)} className="btn-ghost h-8 w-8 p-0" title={t("common.edit")}>
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => toggleActive.mutate(u)}
                        className={cn("btn-ghost h-8 px-2.5 text-[12px]", !u.is_active && "text-accent")}
                      >
                        {u.is_active ? t("users.deactivate") : t("users.activate")}
                      </button>
                      <button
                        onClick={() => { if (confirm(t("users.delete_confirm"))) remove.mutate(u.id); }}
                        className="btn-ghost h-8 w-8 p-0 text-risk-high-fg opacity-40 hover:opacity-100"
                        title={t("common.delete")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-ink-muted text-sm">{t("common.empty")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-md">
            <div className="px-7 py-5 flex items-center justify-between border-b border-ink/[0.05]">
              <h2 className="font-serif text-xl">{t("users.new")}</h2>
              <button onClick={() => setCreateOpen(false)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="p-7 space-y-4">
              <div>
                <label className="label">{t("users.full_name")}</label>
                <input className="input" required value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">{t("auth.email")}</label>
                <input type="email" className="input" required value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div>
                <label className="label">{t("users.initial_password")}</label>
                <input type="password" className="input" required value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
              </div>
              <div>
                <label className="label">{t("users.role")}</label>
                <select className="input" value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="viewer">{t("users.role_viewer")}</option>
                  <option value="admin">{t("users.role_admin")}</option>
                  <option value="super_admin">{t("users.role_super")}</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary flex-1">{t("common.cancel")}</button>
                <button disabled={create.isPending} className="btn-primary flex-1">
                  {create.isPending ? t("common.loading") : t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-7 py-5 flex items-center justify-between border-b border-ink/[0.05] sticky top-0 bg-surface-raised z-10">
              <div>
                <h2 className="font-serif text-xl">{t("users.edit")}</h2>
                <p className="text-[12.5px] text-ink-muted mt-0.5">{editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="btn-ghost h-9 w-9 p-0"><X size={16} /></button>
            </div>

            <div className="p-7 space-y-6">
              {/* Name */}
              <div>
                <label className="label">{t("users.full_name")}</label>
                <input className="input mt-1" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>

              {/* Role selector */}
              <div>
                <label className="label mb-2 block">{t("users.role")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["viewer", "admin", "super_admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditRole(r)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left transition",
                        editRole === r
                          ? r === "super_admin"
                            ? "bg-accent-50 text-accent-700 border-accent"
                            : r === "admin"
                            ? "bg-risk-medium-bg text-risk-medium-fg border-risk-medium-dot"
                            : "bg-surface-sunken text-ink border-ink/30"
                          : "bg-surface border-ink/[0.08] hover:border-ink/20",
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        {r === "super_admin" ? <ShieldCheck size={13} /> : r === "admin" ? <UserIcon size={13} /> : <Eye size={13} />}
                        {editRole === r && <Check size={12} />}
                      </div>
                      <div className="text-[12px] font-semibold leading-tight">
                        {r === "super_admin" ? t("users.role_super") : r === "admin" ? t("users.role_admin") : t("users.role_viewer")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="label mb-1 block">{t("users.permissions")}</label>
                <p className="text-[12px] text-ink-muted mb-3">{t("users.permissions_hint")}</p>
                <div className="space-y-1.5">
                  {ALL_PERMS.map((perm) => {
                    const fromRole = roleGrantsPerm(editRole, perm);
                    const extraChecked = editPerms.includes(perm);
                    const checked = fromRole || extraChecked;
                    return (
                      <label
                        key={perm}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition select-none",
                          fromRole
                            ? "bg-accent/[0.04] border-accent/20 cursor-default"
                            : "cursor-pointer border-ink/[0.07] hover:border-ink/15 hover:bg-surface-sunken/50",
                          extraChecked && !fromRole && "bg-surface-sunken border-ink/20",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={fromRole}
                          onChange={() => !fromRole && togglePerm(perm)}
                          className="accent-accent h-4 w-4 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={cn("text-[13px] font-medium", fromRole ? "text-accent-700" : "text-ink")}>
                            {t(`perm.${perm}`)}
                          </div>
                          <div className="text-[11.5px] text-ink-muted leading-snug mt-0.5">
                            {t(`perm.${perm}_desc`)}
                          </div>
                        </div>
                        {fromRole && (
                          <span className="text-[10.5px] text-accent-600 font-medium shrink-0 bg-accent/10 px-1.5 py-0.5 rounded-full">
                            {t("users.from_role")}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Token limit */}
              <div>
                <label className="label">{t("users.token_limit")}</label>
                <input
                  type="number" min={0} step={50000}
                  className="input font-mono mt-1"
                  value={editTokenLimit}
                  onChange={(e) => setEditTokenLimit(e.target.value)}
                />
                <p className="text-[11.5px] text-ink-subtle mt-1">{t("settings.token_zero_hint")}</p>
              </div>

              {/* Password reset */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <KeyRound size={13} /> {t("users.reset_password")}
                </label>
                <input
                  type="password"
                  className="input mt-1"
                  placeholder={t("users.reset_password_placeholder")}
                  value={resetPwd}
                  onChange={(e) => setResetPwd(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditUser(null)} className="btn-secondary flex-1">
                  {t("common.cancel")}
                </button>
                <button onClick={saveEdit} disabled={update.isPending} className="btn-primary flex-1">
                  {update.isPending ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
