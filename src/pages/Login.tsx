import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/store/auth";

export function Login() {
  const { accessToken, setTokens, setUser } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (accessToken) return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const { data } = await axios.post("/api/v1/auth/login", form);
      setTokens(data.access_token, data.refresh_token);
      const me = await axios.get("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      setUser(me.data);
      nav("/");
    } catch (e: any) {
      setErr(e.response?.data?.detail || "Kirish xatosi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <form onSubmit={submit} className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand">Senariy Analizer</h1>
          <p className="text-sm text-gray-500">Ekspertiza tizimiga kirish</p>
        </div>
        <label className="block mb-3">
          <span className="text-sm font-medium">Email</span>
          <input className="mt-1 w-full border rounded px-3 py-2" type="email"
                 value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block mb-4">
          <span className="text-sm font-medium">Parol</span>
          <input className="mt-1 w-full border rounded px-3 py-2" type="password"
                 value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {err && <div className="text-sm text-red-600 mb-3">{err}</div>}
        <button disabled={loading} className="w-full bg-brand text-white py-2 rounded hover:bg-brand-dark disabled:opacity-60">
          {loading ? "Kirilmoqda..." : "Kirish"}
        </button>
      </form>
    </div>
  );
}
