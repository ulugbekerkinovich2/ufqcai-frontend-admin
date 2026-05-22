import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Documents } from "./pages/Documents";
import { DocumentDetail } from "./pages/DocumentDetail";
import { AnalysisResult } from "./pages/AnalysisResult";
import { Criteria } from "./pages/Criteria";
import { Laws } from "./pages/Laws";
import { Users } from "./pages/Users";
import { Audit } from "./pages/Audit";
import { Usage } from "./pages/Usage";
import { ChangePassword } from "./pages/ChangePassword";
import { Layout } from "./components/shared/Layout";
import { ProtectedRoute } from "./components/shared/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="documents/:id" element={<DocumentDetail />} />
        <Route path="analyses/:id" element={<AnalysisResult />} />
        <Route path="criteria" element={<Criteria />} />
        <Route path="laws" element={<Laws />} />
        <Route path="users" element={<ProtectedRoute superOnly><Users /></ProtectedRoute>} />
        <Route path="usage" element={<ProtectedRoute superOnly><Usage /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute superOnly><Audit /></ProtectedRoute>} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
