import type { Category, ComplaintStatus, Priority } from "@prisma/client";
import { CATEGORIES, PRIORITIES, STATUSES } from "./constants";
import { getOverdueThresholdDays, overdueWhere } from "./overdue";
import { prisma } from "./prisma";

export type DashboardStats = {
  total: number;
  overdue: number;
  thresholdDays: number;
  byStatus: Record<ComplaintStatus, number>;
  byCategory: Record<Category, number>;
  byPriority: Record<Priority, number>;
  avgResolutionDays: number | null;
};

/**
 * Aggregated counts for the admin dashboard. Shared by the dashboard page and
 * GET /api/dashboard/stats so both always report the same numbers.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const thresholdDays = await getOverdueThresholdDays();

  const [statusGroups, categoryGroups, priorityGroups, total, overdue, resolved] = await Promise.all([
    prisma.complaint.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.complaint.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.complaint.groupBy({ by: ["priority"], _count: { _all: true } }),
    prisma.complaint.count(),
    prisma.complaint.count({ where: overdueWhere(thresholdDays) }),
    prisma.complaint.findMany({
      where: { status: "RESOLVED", resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    }),
  ]);

  const zeroed = <K extends string>(keys: readonly K[]) =>
    Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;

  const byStatus = zeroed(STATUSES);
  for (const g of statusGroups) byStatus[g.status] = g._count._all;

  const byCategory = zeroed(CATEGORIES);
  for (const g of categoryGroups) byCategory[g.category] = g._count._all;

  const byPriority = zeroed(PRIORITIES);
  for (const g of priorityGroups) byPriority[g.priority] = g._count._all;

  const avgResolutionDays =
    resolved.length === 0
      ? null
      : resolved.reduce((sum, c) => sum + (c.resolvedAt!.getTime() - c.createdAt.getTime()), 0) /
        resolved.length /
        86_400_000;

  return {
    total,
    overdue,
    thresholdDays,
    byStatus,
    byCategory,
    byPriority,
    avgResolutionDays: avgResolutionDays === null ? null : Math.round(avgResolutionDays * 10) / 10,
  };
}
