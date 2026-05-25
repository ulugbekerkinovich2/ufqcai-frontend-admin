import { useState } from "react";
import { api } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";

export function ChangePassword() {
  const { t } = useI18n();
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
    if (next !== confirm) { setErr(t("auth.passwords_mismatch")); return; }
    if (next.length < 6) { setErr(t("auth.password_too_short")); return; }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { current_password: current, new_password: next });
      setOk(true);
      setCurrent(""); setNext(""); setConfirm("");
      toast.success(t("auth.password_changed"));
      setTimeout(() => nav("/"), 1500);
    } catch (e: any) {
      setErr(e.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl animate-fade-in">
      <button onClick={() => nav(-1)} className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink mb-5">
        <ArrowLeft size={14} /> {t("common.back")}
      </button>
      <header className="mb-7">
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("audit.section")}</p>
        <h1 className="font-serif text-[24px] leading-tight">{t("auth.change_password")}</h1>
      </header>

      <form onSubmit={submit} className="card p-7 space-y-5">
        <div className="flex items-center gap-3 pb-2">
          <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent grid place-items-center">
            <KeyRound size={16} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[15px] font-medium text-ink">{t("auth.change_password")}</div>
            <div className="text-[12.5px] text-ink-muted">{t("auth.password_hint")}</div>
          </div>
        </div>
        <div>
          <label className="label">{t("auth.current_password")}</label>
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} className="input" autoComplete="current-password" />
        </div>
        <div>
          <label className="label">{t("auth.new_password")}</label>
          <input type="password" required value={next} onChange={(e) => setNext(e.target.value)} className="input" autoComplete="new-password" />
        </div>
        <div>
          <label className="label">{t("auth.confirm_password")}</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" autoComplete="new-password" />
        </div>
        {err && <div className="text-sm text-risk-high-fg bg-risk-high-bg/60 px-3 py-2.5 rounded-xl">{err}</div>}
        {ok && (
          <div className="flex items-center gap-2 text-sm text-accent-700 bg-accent-50 px-3 py-2.5 rounded-xl">
            <CheckCircle2 size={15} /> {t("auth.password_changed")}
          </div>
        )}
        <button disabled={loading} className="btn-primary w-full h-11">
          {loading ? t("common.loading") : t("common.save")}
        </button>
      </form>
    </div>
  );
}
