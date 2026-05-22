import { useState } from "react";
import { api } from "@/api/client";
import { useNavigate } from "react-router-dom";

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
    setErr("");
    setOk(false);
    if (next !== confirm) { setErr("Yangi parollar mos kelmadi"); return; }
    if (next.length < 6) { setErr("Parol kamida 6 belgi"); return; }
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
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Parolni o'zgartirish</h1>
      <form onSubmit={submit} className="bg-white p-6 rounded border space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Joriy parol</span>
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Yangi parol</span>
          <input type="password" required value={next} onChange={(e) => setNext(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Yangi parolni takrorlang</span>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        {err && <div className="text-sm text-red-600">{err}</div>}
        {ok && <div className="text-sm text-green-600">Parol o'zgartirildi</div>}
        <button disabled={loading} className="w-full bg-brand text-white py-2 rounded hover:bg-brand-dark disabled:opacity-60">
          {loading ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </form>
    </div>
  );
}
