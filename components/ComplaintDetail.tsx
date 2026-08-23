import Link from "next/link";
import type { Complaint } from "@prisma/client";
import { CategoryBadge, OverdueBadge, PriorityBadge, StatusBadge } from "@/components/Badges";
import HistoryTimeline, { type HistoryEntry } from "@/components/HistoryTimeline";
import { formatDateTime } from "@/lib/format";
import { daysOverdue, isOverdue } from "@/lib/overdue";

type DetailComplaint = Complaint & {
  resident: { name: string; flatNumber: string; email: string; phone: string | null };
  history: HistoryEntry[];
};

/**
 * The complaint page body, shared by residents and admins. `actions` is where
 * the admin control panel is slotted in; residents pass nothing.
 */
export default function ComplaintDetail({
  complaint,
  thresholdDays,
  backHref,
  backLabel,
  actions,
}: {
  complaint: DetailComplaint;
  thresholdDays: number;
  backHref: string;
  backLabel: string;
  actions?: React.ReactNode;
}) {
  const overdue = isOverdue(complaint, thresholdDays);

  return (
    <>
      <Link href={backHref} className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← {backLabel}
      </Link>

      <div className="mb-6">
        <p className="font-mono text-xs text-muted">{complaint.ticketNo}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{complaint.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <CategoryBadge category={complaint.category} />
          {overdue && <OverdueBadge days={daysOverdue(complaint, thresholdDays)} />}
        </div>
      </div>

      {complaint.status === "RESOLVED" && (
        <p className="mb-6 rounded-lg border border-resolved/20 bg-resolved-soft px-4 py-3 text-sm text-resolved">
          This complaint was resolved on {formatDateTime(complaint.resolvedAt ?? complaint.updatedAt)} and is now
          closed. No further status changes are possible.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-2 text-sm font-semibold">Description</h2>
            <p className="text-sm whitespace-pre-wrap text-ink/80">{complaint.description}</p>

            {complaint.photoUrl && (
              <div className="mt-5">
                <h2 className="mb-2 text-sm font-semibold">Attached photo</h2>
                <a href={complaint.photoUrl} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={complaint.photoUrl}
                    alt={`Photo attached to complaint ${complaint.ticketNo}`}
                    className="max-h-96 rounded-lg border border-line object-contain"
                  />
                </a>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-4 text-sm font-semibold">Status history</h2>
            <HistoryTimeline history={complaint.history} />
          </section>
        </div>

        <aside className="space-y-6">
          {actions}

          <section className="card p-5">
            <h2 className="mb-3 text-sm font-semibold">Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Raised by</dt>
                <dd>
                  {complaint.resident.name} · Flat {complaint.resident.flatNumber}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Contact</dt>
                <dd className="break-all">
                  {complaint.resident.email}
                  {complaint.resident.phone ? ` · ${complaint.resident.phone}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Raised on</dt>
                <dd>{formatDateTime(complaint.createdAt)}</dd>
              </div>
              {complaint.resolvedAt && (
                <div>
                  <dt className="text-xs text-muted">Resolved on</dt>
                  <dd>{formatDateTime(complaint.resolvedAt)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted">Overdue threshold</dt>
                <dd>{thresholdDays} days</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
