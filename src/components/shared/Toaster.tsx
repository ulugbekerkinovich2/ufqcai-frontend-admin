import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastItem { id: string; message: string; type: "success" | "error" | "info"; }

const ICONS = {
  success: <CheckCircle2 size={16} className="text-accent shrink-0" />,
  error:   <XCircle     size={16} className="text-risk-high-fg shrink-0" />,
  info:    <Info        size={16} className="text-ink-muted shrink-0" />,
};

const BG = {
  success: "bg-surface-raised border-accent/20",
  error:   "bg-surface-raised border-risk-high-bg",
  info:    "bg-surface-raised border-ink/10",
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => toast._subscribe(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-raised",
            "min-w-[260px] max-w-[380px] animate-fade-in",
            BG[item.type],
          )}
        >
          {ICONS[item.type]}
          <span className="text-[13.5px] text-ink leading-snug flex-1">{item.message}</span>
        </div>
      ))}
    </div>
  );
}
