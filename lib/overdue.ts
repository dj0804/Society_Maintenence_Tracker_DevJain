import type { Complaint } from "@prisma/client";
import { prisma } from "./prisma";
import { DEFAULT_OVERDUE_DAYS, SETTING_OVERDUE_DAYS } from "./constants";

/**
 * Overdue is derived, never stored. Reading the threshold at query time means
 * changing it immediately re-evaluates every complaint, with no backfill job.
 */
export async function getOverdueThresholdDays(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: SETTING_OVERDUE_DAYS } });
  const parsed = Number(row?.value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_OVERDUE_DAYS;
}

export async function setOverdueThresholdDays(days: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: SETTING_OVERDUE_DAYS },
    update: { value: String(days) },
    create: { key: SETTING_OVERDUE_DAYS, value: String(days) },
  });
}

/** The cutoff instant: complaints created before this are past the threshold. */
export function overdueCutoff(thresholdDays: number, now = new Date()): Date {
  return new Date(now.getTime() - thresholdDays * 86_400_000);
}

type OverdueInput = Pick<Complaint, "status" | "createdAt" | "isOverdueFlagged">;

/**
 * A complaint is overdue when it is still unresolved AND either it has aged
 * past the threshold or an admin has manually flagged it.
 */
export function isOverdue(complaint: OverdueInput, thresholdDays: number, now = new Date()): boolean {
  if (complaint.status === "RESOLVED") return false;
  if (complaint.isOverdueFlagged) return true;
  return complaint.createdAt.getTime() <= overdueCutoff(thresholdDays, now).getTime();
}

/** Days a complaint has been open past the threshold (0 when not overdue). */
export function daysOverdue(complaint: OverdueInput, thresholdDays: number, now = new Date()): number {
  if (!isOverdue(complaint, thresholdDays, now)) return 0;
  const ageDays = Math.floor((now.getTime() - complaint.createdAt.getTime()) / 86_400_000);
  return Math.max(0, ageDays - thresholdDays);
}

/** Prisma `where` fragment matching aged-out or manually flagged complaints. */
export function overdueWhere(thresholdDays: number, now = new Date()) {
  return {
    status: { not: "RESOLVED" as const },
    OR: [{ createdAt: { lte: overdueCutoff(thresholdDays, now) } }, { isOverdueFlagged: true }],
  };
}
