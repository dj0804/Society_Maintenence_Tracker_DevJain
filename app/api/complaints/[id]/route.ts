import { handleError, json, HttpError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { allowedNextStatuses } from "@/lib/complaints";
import { getOverdueThresholdDays, daysOverdue, isOverdue } from "@/lib/overdue";
import { prisma } from "@/lib/prisma";

/** GET /api/complaints/:id - a complaint with its full status history. */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiUser();
    const { id } = await ctx.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        resident: { select: { id: true, name: true, flatNumber: true, email: true, phone: true } },
        history: {
          orderBy: { createdAt: "asc" },
          include: { changedBy: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    // 404 rather than 403 for another resident's complaint: do not leak existence.
    if (!complaint) throw new HttpError(404, "Complaint not found");
    if (session.role === "RESIDENT" && complaint.residentId !== session.userId) {
      throw new HttpError(404, "Complaint not found");
    }

    const threshold = await getOverdueThresholdDays();
    return json({
      ...complaint,
      isOverdue: isOverdue(complaint, threshold),
      daysOverdue: daysOverdue(complaint, threshold),
      thresholdDays: threshold,
      allowedNextStatuses: allowedNextStatuses(complaint.status),
    });
  } catch (error) {
    return handleError(error);
  }
}
