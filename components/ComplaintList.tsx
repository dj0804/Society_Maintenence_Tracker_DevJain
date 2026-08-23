import Link from "next/link";
import type { Complaint } from "@prisma/client";
import { CategoryBadge, OverdueBadge, PriorityBadge, StatusBadge } from "@/components/Badges";
import { daysOverdue, isOverdue } from "@/lib/overdue";
import { formatDate } from "@/lib/format";

type Row = Complaint & { resident?: { name: string; flatNumber: string } | null };

/**
 * One complaint list, shared by the resident and admin views. `basePath`
 * decides where a row links to; `showResident` is on only for the admin.
 */
export default function ComplaintList({
  complaints,
  thresholdDays,
  basePath,
  showResident = false,
}: {
  complaints: Row[];
  thresholdDays: number;
  basePath: string;
  showResident?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {complaints.map((complaint) => {
        const overdue = isOverdue(complaint, thresholdDays);
        return (
          <li key={complaint.id}>
            <Link
              href={`${basePath}/${complaint.id}`}
              className={`card block p-4 transition hover:border-brand/40 hover:shadow-sm ${
                overdue ? "border-l-4 border-l-danger" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <span className="font-mono">{complaint.ticketNo}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(complaint.createdAt)}</span>
                    {showResident && complaint.resident && (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          {complaint.resident.name} ({complaint.resident.flatNumber})
                        </span>
                      </>
                    )}
                  </p>
                  <p className="mt-1 truncate font-medium">{complaint.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{complaint.description}</p>
                </div>
                {complaint.photoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={complaint.photoUrl}
                    alt=""
                    className="hidden size-16 shrink-0 rounded-lg border border-line object-cover sm:block"
                  />
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                <CategoryBadge category={complaint.category} />
                {overdue && <OverdueBadge days={daysOverdue(complaint, thresholdDays)} />}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
