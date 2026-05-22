import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { API_BASE_URL } from "@/api/client";
import { ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen flex bg-surface">
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-accent-900 via-accent-700 to-accent-600 text-white">
        <div className="relative z-10 max-w-md m-auto px-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-medium mb-8">
            <ShieldCheck size={14} /> Davlat tizimi · Maxfiy
          </div>
          <h1 className="font-serif text-[44px] leading-[1.1] tracking-tight text-balance">
            Ssenariylarni sun'iy idrok yordamida ekspertizadan o'tkazing.
          </h1>
          <p className="text-white/75 mt-6 leading-relaxed text-[15px] text-pretty">
            Madaniyat vazirligi uchun ssenariylarni madaniy va huquqiy moslik bo'yicha
            izlanadigan, obyektiv tarzda baholaydigan ichki platforma.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-serif text-2xl tabular-nums">10+</div>
              <div className="text-white/60 text-[12.5px]">tayyor mezon</div>
            </div>
            <div>
              <div className="font-serif text-2xl tabular-nums">RAG</div>
              <div className="text-white/60 text-[12.5px]">qonunlar bazasi</div>
            </div>
          </div>
        </div>
        <div aria-hidden className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div aria-hidden className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-accent-300/15 blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-7">
              <div className="h-10 w-10 rounded-xl bg-accent text-white grid place-items-center font-serif text-lg">S</div>
              <div className="font-serif text-lg">Senariy Analizer</div>
            </div>
            <h2 className="font-serif text-2xl mb-1.5">Tizimga kirish</h2>
            <p className="text-sm text-ink-muted">Hisob faqat Super Admin tomonidan yaratiladi.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Elektron pochta</label>
              <input className="input" type="email" autoComplete="email"
                     value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Parol</label>
              <input className="input" type="password" autoComplete="current-password"
                     value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {err && (
              <div className="text-sm text-risk-high-fg bg-risk-high-bg/60 px-3 py-2.5 rounded-xl">{err}</div>
            )}
            <button disabled={loading} className="btn-primary w-full h-11">
              {loading ? "Kirilmoqda..." : "Kirish"}
            </button>
          </div>
          <p className="text-[12.5px] text-ink-subtle mt-8 leading-relaxed">
            Tizimga kirish bilan siz davlat axborot xavfsizligi qoidalariga
            rioya qilish majburiyatini olasiz.
          </p>
        </form>
      </div>
    </div>
  );
}
