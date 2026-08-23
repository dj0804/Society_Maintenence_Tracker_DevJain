import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import ComplaintFilters from "@/components/ComplaintFilters";
import ComplaintList from "@/components/ComplaintList";
import PageHeader, { EmptyState } from "@/components/PageHeader";
import { requirePageUser } from "@/lib/auth";
import { getOverdueThresholdDays, isOverdue, overdueWhere } from "@/lib/overdue";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "All Complaints | Society Maintenance Tracker" };

type Search = { status?: string; category?: string; from?: string; to?: string; overdue?: string };

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requirePageUser("ADMIN");
  const filters = await searchParams;
  const thresholdDays = await getOverdueThresholdDays();

  const where: Prisma.ComplaintWhereInput = {};
  if (filters.status) where.status = filters.status as Prisma.ComplaintWhereInput["status"];
  if (filters.category) where.category = filters.category as Prisma.ComplaintWhereInput["category"];
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from + "T00:00:00.000Z") } : {}),
      ...(filters.to ? { lte: new Date(filters.to + "T23:59:59.999Z") } : {}),
    };
  }
  if (filters.overdue === "true") where.AND = [overdueWhere(thresholdDays)];

  const complaints = await prisma.complaint.findMany({
    where,
    include: { resident: { select: { name: true, flatNumber: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Triage order: overdue first, then High -> Low, then oldest first.
  const sorted = complaints.sort((a, b) => {
    const overdueDelta = Number(isOverdue(b, thresholdDays)) - Number(isOverdue(a, thresholdDays));
    if (overdueDelta !== 0) return overdueDelta;
    const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDelta !== 0) return priorityDelta;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const overdueCount = sorted.filter((c) => isOverdue(c, thresholdDays)).length;

  return (
    <>
      <PageHeader
        title="All complaints"
        description={`${sorted.length} complaint${sorted.length === 1 ? "" : "s"}${
          overdueCount > 0 ? ` · ${overdueCount} overdue, shown first` : ""
        }`}
      />

      <Suspense fallback={null}>
        <ComplaintFilters />
      </Suspense>

      {sorted.length === 0 ? (
        <EmptyState title="No complaints match these filters" hint="Try clearing one or more filters." />
      ) : (
        <ComplaintList
          complaints={sorted}
          thresholdDays={thresholdDays}
          basePath="/admin/complaints"
          showResident
        />
      )}
    </>
  );
}
