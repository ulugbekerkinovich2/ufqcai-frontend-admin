import { useState, useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

type Resolve = (ok: boolean) => void;

let _resolve: Resolve | null = null;
let _setOpts: ((o: ConfirmOptions | null) => void) | null = null;

export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    _resolve = resolve;
    _setOpts?.(opts);
  });
}

export function ConfirmDialog() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    _setOpts = setOpts;
    return () => { _setOpts = null; };
  }, []);

  function respond(ok: boolean) {
    _resolve?.(ok);
    _resolve = null;
    setOpts(null);
  }

  useEffect(() => {
    if (!opts) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { respond(false); return; }
      if (e.key === "Enter") { respond(true); return; }
      if (e.key !== "Tab") return;
      // Fokus tuzog'i — Tab dialog tashqarisiga chiqmasin.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opts]);

  if (!opts) return null;

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-[9998] p-4 animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={opts.title ? "confirm-dialog-title" : undefined}
        aria-describedby="confirm-dialog-message"
        className="bg-surface-raised rounded-2xl shadow-raised w-full max-w-sm animate-scale-in"
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${opts.danger !== false ? "bg-risk-high-bg text-risk-high-fg" : "bg-surface-sunken text-ink-muted"}`}>
              <AlertTriangle size={16} />
            </div>
            <div className="flex-1 min-w-0">
              {opts.title && <h3 id="confirm-dialog-title" className="font-serif text-[17px] leading-tight mb-1">{opts.title}</h3>}
              <p id="confirm-dialog-message" className="text-[13.5px] text-ink-muted leading-relaxed">{opts.message}</p>
            </div>
            <button onClick={() => respond(false)} aria-label="Yopish" className="btn-ghost h-8 w-8 p-0 shrink-0">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={() => respond(false)} className="btn-secondary flex-1 h-10">
            Bekor qilish
          </button>
          <button
            ref={confirmRef}
            onClick={() => respond(true)}
            className={`flex-1 h-10 rounded-xl text-sm font-medium transition ${opts.danger !== false ? "bg-risk-high-bg text-risk-high-fg hover:bg-risk-high-bg/80 border border-risk-high-bg" : "btn-primary"}`}
          >
            {opts.confirmLabel || "Tasdiqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
