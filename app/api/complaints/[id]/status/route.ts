import type { ComplaintStatus } from "@prisma/client";
import { handleError, json } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { changeStatus } from "@/lib/complaints";
import { notifyStatusChange } from "@/lib/notifications";
import { updateStatusSchema } from "@/lib/validation";

/**
 * PATCH /api/complaints/:id/status - admin moves a complaint along its
 * lifecycle. Returns 409 once the complaint is RESOLVED, since resolving
 * closes it permanently.
 */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiUser("ADMIN");
    const { id } = await ctx.params;
    const body = updateStatusSchema.parse(await request.json());

    const { complaint, fromStatus } = await changeStatus({
      complaintId: id,
      to: body.status as ComplaintStatus,
      note: body.note || undefined,
      actorId: session.userId,
    });

    // sendMail swallows its own failures; awaiting keeps the send inside the
    // request lifetime, which serverless runtimes require.
    await notifyStatusChange({
      to: complaint.resident.email,
      residentName: complaint.resident.name,
      ticketNo: complaint.ticketNo,
      title: complaint.title,
      from: fromStatus,
      toStatus: complaint.status,
      note: body.note,
      complaintId: complaint.id,
    });

    return json({ id: complaint.id, status: complaint.status, resolvedAt: complaint.resolvedAt });
  } catch (error) {
    return handleError(error);
  }
}
