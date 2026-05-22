import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import {
  LogOut, FileText, ListChecks, BookOpen, Users, LayoutDashboard, ScrollText, KeyRound, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const langs: { code: "uz" | "ru" | "en"; label: string }[] = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { t, lang, setLang } = useI18n();
  const isSuper = user?.role === "super_admin";
  const initials = (user?.full_name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const items = [
    { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/documents", label: t("nav.documents"), icon: FileText },
    { to: "/criteria", label: t("nav.criteria"), icon: ListChecks },
    { to: "/laws", label: t("nav.laws"), icon: BookOpen },
    { to: "/users", label: t("nav.users"), icon: Users, superOnly: true },
    { to: "/usage", label: t("nav.usage"), icon: DollarSign, superOnly: true },
    { to: "/audit", label: t("nav.audit"), icon: ScrollText, superOnly: true },
  ];

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="w-[260px] shrink-0 bg-surface-raised border-r border-ink/[0.05] flex flex-col">
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-accent text-white grid place-items-center font-serif text-lg">S</div>
            <div>
              <div className="font-serif text-[17px] leading-tight text-ink">{t("app.title")}</div>
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

        <div className="px-3 mb-2">
          <div className="flex gap-1 p-1 rounded-xl bg-surface-sunken">
            {langs.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  "flex-1 h-7 rounded-lg text-[11.5px] font-medium transition",
                  lang === l.code ? "bg-surface-raised text-ink shadow-soft" : "text-ink-muted hover:text-ink",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

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
              <KeyRound size={14} strokeWidth={1.75} /> {t("auth.password")}
            </NavLink>
            <button
              onClick={() => { logout(); nav("/login"); }}
              className="btn-ghost h-8 text-[12.5px] hover:text-risk-high-fg"
              title={t("auth.logout")}
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
