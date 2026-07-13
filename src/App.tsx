import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/shared/Layout";
import { ProtectedRoute } from "./components/shared/ProtectedRoute";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { Toaster } from "./components/shared/Toaster";
import { ConfirmDialog } from "./components/shared/ConfirmDialog";

const Login          = lazy(() => import("./pages/Login").then((m) => ({ default: m.Login })));
const Dashboard      = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Documents      = lazy(() => import("./pages/Documents").then((m) => ({ default: m.Documents })));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail").then((m) => ({ default: m.DocumentDetail })));
const AnalysisResult = lazy(() => import("./pages/AnalysisResult").then((m) => ({ default: m.AnalysisResult })));
const Criteria       = lazy(() => import("./pages/Criteria").then((m) => ({ default: m.Criteria })));
const Laws           = lazy(() => import("./pages/Laws").then((m) => ({ default: m.Laws })));
const Users          = lazy(() => import("./pages/Users").then((m) => ({ default: m.Users })));
const Audit          = lazy(() => import("./pages/Audit").then((m) => ({ default: m.Audit })));
const Usage          = lazy(() => import("./pages/Usage").then((m) => ({ default: m.Usage })));
const Settings       = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const Capacity       = lazy(() => import("./pages/Capacity").then((m) => ({ default: m.Capacity })));
const ChangePassword = lazy(() => import("./pages/ChangePassword").then((m) => ({ default: m.ChangePassword })));
const Triage         = lazy(() => import("./pages/Triage").then((m) => ({ default: m.Triage })));
const ExpertReview   = lazy(() => import("./pages/ExpertReview").then((m) => ({ default: m.ExpertReview })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster />
      <ConfirmDialog />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="documents" element={<ErrorBoundary><Documents /></ErrorBoundary>} />
            <Route path="documents/:id" element={<ErrorBoundary><DocumentDetail /></ErrorBoundary>} />
            <Route path="analyses/:id" element={<ErrorBoundary><AnalysisResult /></ErrorBoundary>} />
            <Route path="criteria" element={<ErrorBoundary><Criteria /></ErrorBoundary>} />
            <Route path="laws" element={<ErrorBoundary><Laws /></ErrorBoundary>} />
            <Route path="users" element={<ProtectedRoute permission="manage_users"><ErrorBoundary><Users /></ErrorBoundary></ProtectedRoute>} />
            <Route path="usage" element={<ProtectedRoute permission="view_usage"><ErrorBoundary><Usage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="audit" element={<ProtectedRoute permission="view_audit"><ErrorBoundary><Audit /></ErrorBoundary></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute superOnly><ErrorBoundary><Settings /></ErrorBoundary></ProtectedRoute>} />
            <Route path="capacity" element={<ProtectedRoute superOnly><ErrorBoundary><Capacity /></ErrorBoundary></ProtectedRoute>} />
            <Route path="triage" element={<ProtectedRoute roles={["mutaxassis"]}><ErrorBoundary><Triage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="expert-review" element={<ProtectedRoute roles={["ekspert"]}><ErrorBoundary><ExpertReview /></ErrorBoundary></ProtectedRoute>} />
            <Route path="expert-review/:docId" element={<ProtectedRoute roles={["ekspert"]}><ErrorBoundary><ExpertReview /></ErrorBoundary></ProtectedRoute>} />
            <Route path="change-password" element={<ErrorBoundary><ChangePassword /></ErrorBoundary>} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </>
  );
}
