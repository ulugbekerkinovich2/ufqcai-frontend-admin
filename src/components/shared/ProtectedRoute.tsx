import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/store/auth";

export function ProtectedRoute({ children, superOnly }: { children: ReactNode; superOnly?: boolean }) {
  const { accessToken, user } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (superOnly && user?.role !== "super_admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}
