import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { LogOut, FileText, ListChecks, BookOpen, Users, BarChart3, ScrollText, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/documents", label: "Ssenariylar", icon: FileText },
  { to: "/criteria", label: "Kriteriyalar", icon: ListChecks },
  { to: "/laws", label: "Qonunlar bazasi", icon: BookOpen },
  { to: "/users", label: "Foydalanuvchilar", icon: Users, superOnly: true },
  { to: "/audit", label: "Audit log", icon: ScrollText, superOnly: true },
];

export function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const isSuper = user?.role === "super_admin";

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="px-5 py-4 border-b">
          <div className="text-lg font-bold text-brand">Senariy Analizer</div>
          <div className="text-xs text-gray-500">Madaniyat vazirligi</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.filter((i) => !i.superOnly || isSuper).map((i) => (
            <NavLink
              key={i.to} to={i.to} end={i.to === "/"}
              className={({ isActive }) => cn(
                "flex items-center gap-2 px-3 py-2 rounded text-sm",
                isActive ? "bg-brand text-white" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <i.icon size={16} /> {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="text-sm font-medium">{user?.full_name}</div>
          <div className="text-xs text-gray-500 mb-2">{user?.email}</div>
          <NavLink to="/change-password" className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand mb-2">
            <KeyRound size={14} /> Parolni o'zgartirish
          </NavLink>
          <button
            onClick={() => { logout(); nav("/login"); }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600"
          >
            <LogOut size={14} /> Chiqish
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
