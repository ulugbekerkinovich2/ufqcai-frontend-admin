import { useState } from "react";
import { api } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";

export function ChangePassword() {
  const nav = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setOk(false);
    if (next !== confirm) { setErr("Yangi parollar mos kelmadi"); return; }
    if (next.length < 6) { setErr("Parol kamida 6 belgidan iborat bo'lishi kerak"); return; }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { current_password: current, new_password: next });
      setOk(true);
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => nav("/"), 1500);
    } catch (e: any) {
      setErr(e.response?.data?.detail || "Xato");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl animate-fade-in">
      <button onClick={() => nav(-1)} className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink mb-5">
        <ArrowLeft size={14} /> Orqaga
      </button>
      <header className="mb-7">
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">Xavfsizlik</p>
        <h1 className="font-serif text-[32px] leading-tight">Parolni o'zgartirish</h1>
        <p className="text-[13.5px] text-ink-muted mt-2">Davriy yangilanish maxfiylik standartlariga muvofiq tavsiya etiladi.</p>
      </header>

      <form onSubmit={submit} className="card p-7 space-y-5">
        <div className="flex items-center gap-3 pb-2">
          <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent grid place-items-center">
            <KeyRound size={16} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[15px] font-medium text-ink">Parol yangilash</div>
            <div className="text-[12.5px] text-ink-muted">Kamida 6 belgi · katta/kichik harf + raqam tavsiya etiladi</div>
          </div>
        </div>
        <div>
          <label className="label">Joriy parol</label>
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} className="input" autoComplete="current-password" />
        </div>
        <div>
          <label className="label">Yangi parol</label>
          <input type="password" required value={next} onChange={(e) => setNext(e.target.value)} className="input" autoComplete="new-password" />
        </div>
        <div>
          <label className="label">Yangi parolni takrorlang</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" autoComplete="new-password" />
        </div>
        {err && <div className="text-sm text-risk-high-fg bg-risk-high-bg/60 px-3 py-2.5 rounded-xl">{err}</div>}
        {ok && (
          <div className="flex items-center gap-2 text-sm text-accent-700 bg-accent-50 px-3 py-2.5 rounded-xl">
            <CheckCircle2 size={15} /> Parol muvaffaqiyatli o'zgartirildi
          </div>
        )}
        <button disabled={loading} className="btn-primary w-full h-11">
          {loading ? "Saqlanmoqda..." : "Yangi parolni saqlash"}
        </button>
      </form>
    </div>
  );
}
