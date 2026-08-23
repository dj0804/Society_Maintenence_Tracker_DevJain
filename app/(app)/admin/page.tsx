import Link from "next/link";
import ComplaintList from "@/components/ComplaintList";
import PageHeader, { EmptyState } from "@/components/PageHeader";
import { requirePageUser } from "@/lib/auth";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { getDashboardStats } from "@/lib/dashboard";
import { getOverdueThresholdDays, overdueWhere } from "@/lib/overdue";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dashboard | Society Maintenance Tracker" };

const STATUS_BAR: Record<string, string> = {
  OPEN: "bg-open",
  IN_PROGRESS: "bg-progress",
  RESOLVED: "bg-resolved",
};

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-2xl font-semibold ${accent ? "text-danger" : ""}`}>{value}</p>
    </div>
  );
}

/** Proportional bar; a count of 0 still shows its row so the list stays stable. */
function Bar({ label, count, total, className }: { label: string; count: number; total: number; className: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted">
          {count} <span className="text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-canvas">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requirePageUser("ADMIN");

  const thresholdDays = await getOverdueThresholdDays();
  const [stats, overdueComplaints] = await Promise.all([
    getDashboardStats(),
    prisma.complaint.findMany({
      where: overdueWhere(thresholdDays),
      include: { resident: { select: { name: true, flatNumber: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }], // enum order is LOW < MEDIUM < HIGH, so desc puts High first
      take: 5,
    }),
  ]);

  const activeCategories = Object.entries(stats.byCategory)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Complaint overview for the society. Complaints open longer than ${thresholdDays} days count as overdue.`}
        action={
          <Link href="/admin/complaints" className="btn-secondary">
            View all complaints
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total complaints" value={stats.total} />
        <StatCard label="Open" value={stats.byStatus.OPEN} />
        <StatCard label="In progress" value={stats.byStatus.IN_PROGRESS} />
        <StatCard label="Resolved" value={stats.byStatus.RESOLVED} />
        <StatCard label="Overdue" value={stats.overdue} accent={stats.overdue > 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">By status</h2>
          <div className="space-y-4">
            {(["OPEN", "IN_PROGRESS", "RESOLVED"] as const).map((status) => (
              <Bar
                key={status}
                label={STATUS_LABELS[status]}
                count={stats.byStatus[status]}
                total={stats.total}
                className={STATUS_BAR[status]}
              />
            ))}
          </div>
          {stats.avgResolutionDays !== null && (
            <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
              Average time to resolve:{" "}
              <span className="font-medium text-ink">{stats.avgResolutionDays} days</span>
            </p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">By category</h2>
          {activeCategories.length === 0 ? (
            <p className="text-sm text-muted">No complaints have been raised yet.</p>
          ) : (
            <div className="space-y-4">
              {activeCategories.map(([category, count]) => (
                <Bar
                  key={category}
                  label={CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                  count={count}
                  total={stats.total}
                  className="bg-brand"
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">
          Needs attention{" "}
          <span className="font-normal text-muted">
            — overdue complaints, highest priority first
          </span>
        </h2>
        {overdueComplaints.length === 0 ? (
          <EmptyState title="Nothing is overdue" hint="Every open complaint is still within the threshold." />
        ) : (
          <ComplaintList
            complaints={overdueComplaints}
            thresholdDays={thresholdDays}
            basePath="/admin/complaints"
            showResident
          />
        )}
      </section>
    </>
  );
}
