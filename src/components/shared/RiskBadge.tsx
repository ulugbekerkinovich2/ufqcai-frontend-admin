import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const MAP: Record<string, { label: string; cls: string; dot: string }> = {
  None: { label: "Yo'q", cls: "bg-risk-none-bg text-risk-none-fg", dot: "bg-risk-none-dot" },
  Low: { label: "Past", cls: "bg-risk-low-bg text-risk-low-fg", dot: "bg-risk-low-dot" },
  Medium: { label: "O'rta", cls: "bg-risk-medium-bg text-risk-medium-fg", dot: "bg-risk-medium-dot" },
  High: { label: "Yuqori", cls: "bg-risk-high-bg text-risk-high-fg", dot: "bg-risk-high-dot" },
};

export function RiskBadge({ level, size = "md" }: { level?: RiskLevel | string; size?: "sm" | "md" }) {
  const info = MAP[level || "None"] || MAP.None;
  return (
    <span
      className={cn(
        "chip",
        info.cls,
        size === "sm" && "text-[11px] py-0",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", info.dot)} />
      {info.label}
    </span>
  );
}
