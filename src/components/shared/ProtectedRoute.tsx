import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/store/auth";

interface Props {
  children: ReactNode;
  superOnly?: boolean;
  permission?: string;
}

export function ProtectedRoute({ children, superOnly, permission }: Props) {
  const { accessToken, user } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  const isSuper = user?.role === "super_admin";
  if (superOnly && !isSuper) return <Navigate to="/" replace />;
  if (permission && !isSuper && !(user?.permissions ?? []).includes(permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
