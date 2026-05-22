import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const MAP: Record<string, { label: string; cls: string }> = {
  None: { label: "Yo'q", cls: "bg-gray-100 text-gray-700 border-gray-300" },
  Low: { label: "Past", cls: "bg-yellow-50 text-yellow-800 border-yellow-300" },
  Medium: { label: "O'rta", cls: "bg-orange-50 text-orange-800 border-orange-300" },
  High: { label: "Yuqori", cls: "bg-red-50 text-red-700 border-red-300" },
};

export function RiskBadge({ level }: { level?: RiskLevel | string }) {
  const info = MAP[level || "None"] || MAP.None;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium", info.cls)}>
      {info.label}
    </span>
  );
}
