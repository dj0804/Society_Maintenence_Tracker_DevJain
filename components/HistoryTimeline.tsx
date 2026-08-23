import type { ComplaintStatus, Role } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

export type HistoryEntry = {
  id: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  note: string | null;
  createdAt: Date;
  changedBy: { name: string; role: Role };
};

const DOT: Record<ComplaintStatus, string> = {
  OPEN: "bg-open",
  IN_PROGRESS: "bg-progress",
  RESOLVED: "bg-resolved",
};

/**
 * The complaint's audit trail. Every row is one append-only history record:
 * what changed, who changed it, when, and why.
 */
export default function HistoryTimeline({ history }: { history: HistoryEntry[] }) {
  return (
    <ol className="relative space-y-6 pl-6">
      <span className="absolute top-2 bottom-2 left-[5px] w-px bg-line" aria-hidden />
      {history.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className={`absolute top-1.5 -left-[21px] size-[11px] rounded-full ring-4 ring-surface ${DOT[entry.toStatus]}`}
            aria-hidden
          />
          <p className="text-sm font-medium">
            {entry.fromStatus === null ? (
              "Complaint raised"
            ) : (
              <>
                {STATUS_LABELS[entry.fromStatus]} <span className="text-muted">→</span>{" "}
                {STATUS_LABELS[entry.toStatus]}
              </>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {formatDateTime(entry.createdAt)} · by {entry.changedBy.name}
            {entry.changedBy.role === "ADMIN" ? " (Admin)" : ""}
          </p>
          {entry.note && (
            <p className="mt-2 rounded-lg border-l-2 border-line bg-canvas px-3 py-2 text-sm text-ink/80">
              {entry.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
