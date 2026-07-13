import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { ProtectedRoute } from "./ProtectedRoute";

function renderWithRoute(children: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Home page</div>} />
        <Route path="/protected" element={children} />
      </Routes>
    </MemoryRouter>,
  );
}

function setAuthState(overrides: Partial<ReturnType<typeof useAuth.getState>>) {
  useAuth.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    ...overrides,
  } as any);
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    setAuthState({});
  });

  it("redirects to /login when there is no access token", () => {
    renderWithRoute(<ProtectedRoute>secret</ProtectedRoute>);
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders children when authenticated with no extra restriction", () => {
    setAuthState({ accessToken: "tok", user: { role: "viewer" } as any });
    renderWithRoute(<ProtectedRoute>secret</ProtectedRoute>);
    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("redirects non-super users away from superOnly routes", () => {
    setAuthState({ accessToken: "tok", user: { role: "admin" } as any });
    renderWithRoute(<ProtectedRoute superOnly>secret</ProtectedRoute>);
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });

  it("allows super_admin through superOnly routes", () => {
    setAuthState({ accessToken: "tok", user: { role: "super_admin" } as any });
    renderWithRoute(<ProtectedRoute superOnly>secret</ProtectedRoute>);
    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("blocks users missing the required permission", () => {
    setAuthState({ accessToken: "tok", user: { role: "viewer", permissions: [] } as any });
    renderWithRoute(<ProtectedRoute permission="manage_users">secret</ProtectedRoute>);
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });

  it("allows users with the granted permission", () => {
    setAuthState({ accessToken: "tok", user: { role: "viewer", permissions: ["manage_users"] } as any });
    renderWithRoute(<ProtectedRoute permission="manage_users">secret</ProtectedRoute>);
    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("blocks a role not in the roles list", () => {
    setAuthState({ accessToken: "tok", user: { role: "viewer" } as any });
    renderWithRoute(<ProtectedRoute roles={["mutaxassis"]}>secret</ProtectedRoute>);
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });

  it("allows a role in the roles list", () => {
    setAuthState({ accessToken: "tok", user: { role: "mutaxassis" } as any });
    renderWithRoute(<ProtectedRoute roles={["mutaxassis"]}>secret</ProtectedRoute>);
    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("lets admin bypass a roles-restricted route (full manage)", () => {
    setAuthState({ accessToken: "tok", user: { role: "admin" } as any });
    renderWithRoute(<ProtectedRoute roles={["mutaxassis"]}>secret</ProtectedRoute>);
    expect(screen.getByText("secret")).toBeInTheDocument();
  });
});
