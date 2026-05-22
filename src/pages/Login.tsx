import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { API_BASE_URL } from "@/api/client";
import { ShieldCheck, Loader2, ArrowRight } from "lucide-react";

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
      const { data } = await axios.post(`${API_BASE_URL}/auth/login`, form);
      setTokens(data.access_token, data.refresh_token);
      const me = await axios.get(`${API_BASE_URL}/auth/me`, {
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
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden px-5 py-10">
      {/* Subtle ambient background */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[760px] rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-accent-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-11 w-11 rounded-xl bg-accent text-white grid place-items-center shadow-card">
            <ShieldCheck size={20} strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-serif text-[18px] leading-tight text-ink">Senariy Analizer</div>
            <div className="text-[12px] text-ink-muted">Madaniyat vazirligi · Ichki tizim</div>
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={submit} className="bg-surface-raised rounded-2xl shadow-card p-7 space-y-5">
          <div>
            <h1 className="font-serif text-[22px] leading-tight text-ink">Tizimga kirish</h1>
            <p className="text-[13px] text-ink-muted mt-1">
              Hisob faqat Super Admin tomonidan yaratiladi
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Elektron pochta</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Parol</label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {err && (
            <div className="text-sm text-risk-high-fg bg-risk-high-bg/60 px-3.5 py-2.5 rounded-xl border border-risk-high-bg">
              {err}
            </div>
          )}

          <button
            disabled={loading}
            className="btn-primary w-full h-11 group"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Tekshirilmoqda...
              </>
            ) : (
              <>
                Kirish
                <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-7 flex items-center justify-center gap-2 text-[12px] text-ink-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Davlat axborot xavfsizligi standartlariga muvofiq
        </div>
        <p className="text-[11.5px] text-ink-subtle text-center mt-2">
          © {new Date().getFullYear()} O'zbekiston Respublikasi Madaniyat vazirligi
        </p>
      </div>
    </div>
  );
}
