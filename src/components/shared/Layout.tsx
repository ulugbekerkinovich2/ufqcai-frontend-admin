import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import {
  LogOut, FileText, ListChecks, BookOpen, Users, LayoutDashboard, ScrollText, KeyRound, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Boshqaruv paneli", icon: LayoutDashboard },
  { to: "/documents", label: "Ssenariylar", icon: FileText },
  { to: "/criteria", label: "Kriteriyalar", icon: ListChecks },
  { to: "/laws", label: "Qonunlar bazasi", icon: BookOpen },
  { to: "/users", label: "Foydalanuvchilar", icon: Users, superOnly: true },
  { to: "/usage", label: "OpenAI sarflar", icon: DollarSign, superOnly: true },
  { to: "/audit", label: "Audit jurnali", icon: ScrollText, superOnly: true },
];

export function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const isSuper = user?.role === "super_admin";
  const initials = (user?.full_name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="w-[260px] shrink-0 bg-surface-raised border-r border-ink/[0.05] flex flex-col">
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-accent text-white grid place-items-center font-serif text-lg">S</div>
            <div>
              <div className="font-serif text-[17px] leading-tight text-ink">Senariy Analizer</div>
              <div className="text-[11px] text-ink-muted">Madaniyat vazirligi</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {items.filter((i) => !i.superOnly || isSuper).map((i) => (
            <NavLink
              key={i.to} to={i.to} end={i.to === "/"}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3.5 h-10 rounded-xl text-[14px] transition",
                isActive
                  ? "bg-accent-50 text-accent-700 font-medium"
                  : "text-ink-muted hover:text-ink hover:bg-ink/[0.04]",
              )}
            >
              <i.icon size={17} strokeWidth={1.75} />
              <span>{i.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="m-3 p-4 rounded-2xl bg-surface-sunken">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent/10 text-accent grid place-items-center text-sm font-semibold tracking-tight">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-ink truncate">{user?.full_name}</div>
              <div className="text-[11.5px] text-ink-muted truncate">{user?.email}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            <NavLink to="/change-password" className="btn-ghost flex-1 h-8 text-[12.5px]">
              <KeyRound size={14} strokeWidth={1.75} /> Parol
            </NavLink>
            <button
              onClick={() => { logout(); nav("/login"); }}
              className="btn-ghost h-8 text-[12.5px] hover:text-risk-high-fg"
              title="Chiqish"
            >
              <LogOut size={14} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-[1280px] mx-auto px-10 py-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
