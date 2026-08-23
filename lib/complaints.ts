import { ComplaintStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { HttpError } from "./api";

/**
 * The complaint lifecycle, declared once. RESOLVED has no outgoing edges:
 * once a complaint is resolved it is closed for good.
 */
const TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  OPEN: [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED],
  IN_PROGRESS: [ComplaintStatus.RESOLVED],
  RESOLVED: [],
};

export function allowedNextStatuses(current: ComplaintStatus): ComplaintStatus[] {
  return TRANSITIONS[current];
}

export function assertTransition(from: ComplaintStatus, to: ComplaintStatus): void {
  if (from === ComplaintStatus.RESOLVED) {
    throw new HttpError(409, "This complaint is resolved and closed; its status can no longer change.");
  }
  if (from === to) {
    throw new HttpError(409, `Complaint is already ${to}.`);
  }
  if (!TRANSITIONS[from].includes(to)) {
    throw new HttpError(409, `Cannot move a complaint from ${from} to ${to}.`);
  }
}

/**
 * Allocates the next human-readable ticket number. The upsert runs as a single
 * statement so concurrent complaint submissions cannot claim the same number.
 */
export async function nextTicketNo(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.$queryRaw<{ value: string }[]>`
    INSERT INTO "Setting" ("key", "value", "updatedAt")
    VALUES ('complaint_seq', '1', now())
    ON CONFLICT ("key") DO UPDATE
      SET "value" = ((("Setting"."value")::int + 1)::text), "updatedAt" = now()
    RETURNING "value"
  `;
  const seq = Number(rows[0]?.value ?? 1);
  return `SMT-${String(seq).padStart(4, "0")}`;
}

/**
 * Applies a status change and appends the matching history row in one
 * transaction, so the audit trail can never drift from the complaint.
 * Returns the updated complaint plus the resident, for the notification email.
 */
export async function changeStatus(params: {
  complaintId: string;
  to: ComplaintStatus;
  note?: string;
  actorId: string;
}) {
  const { complaintId, to, note, actorId } = params;

  return prisma.$transaction(async (tx) => {
    const complaint = await tx.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new HttpError(404, "Complaint not found");

    assertTransition(complaint.status, to);

    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: to,
        resolvedAt: to === ComplaintStatus.RESOLVED ? new Date() : null,
        // A complaint that moves forward is no longer manually flagged.
        isOverdueFlagged: to === ComplaintStatus.RESOLVED ? false : complaint.isOverdueFlagged,
      },
      include: { resident: true },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        fromStatus: complaint.status,
        toStatus: to,
        note: note?.trim() || null,
        changedById: actorId,
      },
    });

    return { complaint: updated, fromStatus: complaint.status };
  });
}
