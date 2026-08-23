import type { Category, ComplaintStatus, Priority } from "@prisma/client";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";

const STATUS_CLASS: Record<ComplaintStatus, string> = {
  OPEN: "bg-open-soft text-open",
  IN_PROGRESS: "bg-progress-soft text-progress",
  RESOLVED: "bg-resolved-soft text-resolved",
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`badge ${STATUS_CLASS[status]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

const PRIORITY_CLASS: Record<Priority, string> = {
  LOW: "border-line text-muted",
  MEDIUM: "border-open/30 text-open",
  HIGH: "border-danger/30 text-danger",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`badge border bg-surface ${PRIORITY_CLASS[priority]}`}>
      {PRIORITY_LABELS[priority]} priority
    </span>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return <span className="badge bg-canvas text-muted">{CATEGORY_LABELS[category]}</span>;
}

export function OverdueBadge({ days }: { days?: number }) {
  return (
    <span className="badge bg-danger-soft text-danger">
      Overdue{days && days > 0 ? ` by ${days}d` : ""}
    </span>
  );
}

export function ImportantBadge() {
  return <span className="badge bg-danger-soft text-danger">Important</span>;
}
