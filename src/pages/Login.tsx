import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { API_BASE_URL } from "@/api/client";
import { useI18n } from "@/lib/i18n";
import { LogoMark } from "@/components/shared/Logo";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";

export function Login() {
  const { accessToken, setTokens, setUser } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
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
          <LogoMark size={44} />
          <div>
            <div className="font-serif text-[18px] leading-tight text-ink">{t("app.title")}</div>
            <div className="text-[12px] text-ink-muted">{t("app.subtitle")}</div>
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={submit} className="bg-surface-raised rounded-2xl shadow-card p-7 space-y-5">
          <div>
            <h1 className="font-serif text-[22px] leading-tight text-ink">{t("auth.login")}</h1>
            <p className="text-[13px] text-ink-muted mt-1">{t("auth.note")}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">{t("auth.email")}</label>
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
              <label className="label">{t("auth.password")}</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
                <Loader2 size={15} className="animate-spin" /> {t("auth.signing_in")}
              </>
            ) : (
              <>
                {t("auth.submit")}
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
