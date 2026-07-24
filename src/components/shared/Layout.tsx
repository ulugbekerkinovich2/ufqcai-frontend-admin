import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";
import {
  LogOut, FileText, ListChecks, BookOpen, Users, LayoutDashboard, ScrollText,
  KeyRound, DollarSign, SlidersHorizontal, Menu, X, Activity, ClipboardCheck, UserSearch, Gavel,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LogoMark } from "./Logo";

const langs: { code: "uz" | "ru" | "en"; label: string }[] = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const { t, lang, setLang } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSuper = user?.role === "super_admin";
  const isAdmin = isSuper || user?.role === "admin";
  const hasPerm = (key: string) => isSuper || (user?.permissions ?? []).includes(key);
  const isMutaxassis = isAdmin || user?.role === "mutaxassis";
  const isEkspert = isAdmin || user?.role === "ekspert";
  const isKomissiya = isAdmin || user?.role === "komissiya";
  const initials = (user?.full_name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  // Close mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const items = [
    { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard, visible: true },
    { to: "/documents", label: t("nav.documents"), icon: FileText, visible: true },
    { to: "/criteria", label: t("nav.criteria"), icon: ListChecks, visible: true },
    { to: "/laws", label: t("nav.laws"), icon: BookOpen, visible: true },
    { to: "/triage", label: t("nav.triage"), icon: UserSearch, visible: isMutaxassis },
    { to: "/expert-review", label: t("nav.expert_review"), icon: ClipboardCheck, visible: isEkspert },
    { to: "/tender", label: t("nav.tender"), icon: Gavel, visible: isMutaxassis || isKomissiya },
    { to: "/tender-scoring", label: t("nav.tender_scoring"), icon: Gavel, visible: isKomissiya },
    { to: "/users", label: t("nav.users"), icon: Users, visible: hasPerm("manage_users") },
    { to: "/usage", label: t("nav.usage"), icon: DollarSign, visible: hasPerm("view_usage") },
    { to: "/audit", label: t("nav.audit"), icon: ScrollText, visible: hasPerm("view_audit") },
    { to: "/settings", label: t("nav.settings"), icon: SlidersHorizontal, visible: isSuper },
    { to: "/capacity", label: t("nav.capacity"), icon: Activity, visible: isSuper },
  ];

  const SidebarContent = () => (
    <>
      <div className="px-6 pt-7 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <div>
            <div className="font-serif text-[17px] leading-tight text-ink">{t("app.title")}</div>
            <div className="text-[11px] text-ink-muted">{t("app.subtitle")}</div>
          </div>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label={t("common.cancel")}
          className="lg:hidden btn-ghost h-9 w-9 p-0 -mr-1"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {items.filter((i) => i.visible).map((i) => (
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
              aria-pressed={lang === l.code}
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
          <div className="h-9 w-9 rounded-full bg-accent/10 text-accent grid place-items-center text-sm font-semibold tracking-tight shrink-0">
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
            aria-label={t("auth.logout")}
          >
            <LogOut size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-5 pt-1 text-center">
        <p className="text-[10.5px] text-ink-subtle leading-relaxed">{t("app.copyright")}</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 bg-surface-raised border-r border-ink/[0.05] flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-surface-raised border-r border-ink/[0.05] flex flex-col",
        "transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-5 h-14 bg-surface-raised border-b border-ink/[0.05] shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label={t("common.open_menu")}
            className="btn-ghost h-9 w-9 p-0"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <LogoMark size={26} />
            <span className="font-serif text-[15px] text-ink">{t("app.title")}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-9">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-ink/[0.05] px-4 sm:px-6 lg:px-10 py-4 text-center sm:text-left">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <p className="text-[11px] text-ink-subtle">{t("app.copyright")}</p>
            <p className="text-[11px] text-ink-subtle">
              {t("app.footer_support")} <a href="mailto:admin@ufqcai.uz" className="text-accent hover:underline">admin@ufqcai.uz</a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
