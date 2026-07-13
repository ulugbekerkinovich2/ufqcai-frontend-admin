import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/types";
import { useI18n } from "@/lib/i18n";

const MAP: Record<ReviewStatus, { cls: string; dot: string }> = {
  pending_triage: { cls: "bg-surface-sunken text-ink-muted", dot: "bg-ink-subtle" },
  assigned: { cls: "bg-risk-low-bg text-risk-low-fg", dot: "bg-risk-low-dot" },
  rejected: { cls: "bg-risk-high-bg text-risk-high-fg", dot: "bg-risk-high-dot" },
  evaluated: { cls: "bg-accent-50 text-accent-700", dot: "bg-accent" },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { t } = useI18n();
  const info = MAP[status] || MAP.pending_triage;
  return (
    <span className={cn("chip", info.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", info.dot)} />
      {t(`documents.review_status_${status}`)}
    </span>
  );
}
