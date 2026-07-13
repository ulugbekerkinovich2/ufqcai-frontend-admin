import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/store/auth";

interface Props {
  children: ReactNode;
  superOnly?: boolean;
  permission?: string;
  roles?: string[];
}

export function ProtectedRoute({ children, superOnly, permission, roles }: Props) {
  const { accessToken, user } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  const isSuper = user?.role === "super_admin";
  const isAdmin = isSuper || user?.role === "admin";
  if (superOnly && !isSuper) return <Navigate to="/" replace />;
  if (permission && !isSuper && !(user?.permissions ?? []).includes(permission)) return <Navigate to="/" replace />;
  if (roles && !isAdmin && !roles.includes(user?.role ?? "")) return <Navigate to="/" replace />;
  return <>{children}</>;
}
