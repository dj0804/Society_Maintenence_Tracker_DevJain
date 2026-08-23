import Link from "next/link";
import { redirect } from "next/navigation";
import ComplaintList from "@/components/ComplaintList";
import PageHeader, { EmptyState } from "@/components/PageHeader";
import { requirePageUser } from "@/lib/auth";
import { getOverdueThresholdDays, isOverdue } from "@/lib/overdue";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/lib/constants";

export const metadata = { title: "My Complaints | Society Maintenance Tracker" };

export default async function MyComplaintsPage() {
  const session = await requirePageUser();
  if (session.role === "ADMIN") redirect("/admin/complaints");

  const [complaints, thresholdDays] = await Promise.all([
    prisma.complaint.findMany({
      where: { residentId: session.userId },
      orderBy: { createdAt: "desc" },
    }),
    getOverdueThresholdDays(),
  ]);

  const counts = {
    OPEN: complaints.filter((c) => c.status === "OPEN").length,
    IN_PROGRESS: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    RESOLVED: complaints.filter((c) => c.status === "RESOLVED").length,
    overdue: complaints.filter((c) => isOverdue(c, thresholdDays)).length,
  };

  return (
    <>
      <PageHeader
        title="My complaints"
        description="Every complaint you have raised, with its current status and full history."
        action={
          <Link href="/complaints/new" className="btn-primary">
            Raise a complaint
          </Link>
        }
      />

      {complaints.length > 0 && (
        <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["OPEN", "IN_PROGRESS", "RESOLVED"] as const).map((status) => (
            <div key={status} className="card px-4 py-3">
              <dt className="text-xs text-muted">{STATUS_LABELS[status]}</dt>
              <dd className="mt-0.5 text-xl font-semibold">{counts[status]}</dd>
            </div>
          ))}
          <div className="card px-4 py-3">
            <dt className="text-xs text-muted">Overdue</dt>
            <dd className={`mt-0.5 text-xl font-semibold ${counts.overdue > 0 ? "text-danger" : ""}`}>
              {counts.overdue}
            </dd>
          </div>
        </dl>
      )}

      {complaints.length === 0 ? (
        <EmptyState
          title="No complaints yet"
          hint="When something needs the society's attention, raise a complaint and you can follow its progress here."
        />
      ) : (
        <ComplaintList complaints={complaints} thresholdDays={thresholdDays} basePath="/complaints" />
      )}
    </>
  );
}
