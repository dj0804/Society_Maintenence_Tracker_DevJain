import type { Priority } from "@prisma/client";
import { handleError, json, HttpError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePrioritySchema } from "@/lib/validation";

/** PATCH /api/complaints/:id/priority - admin sets Low / Medium / High. */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser("ADMIN");
    const { id } = await ctx.params;
    const { priority } = updatePrioritySchema.parse(await request.json());

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Complaint not found");
    if (existing.status === "RESOLVED") {
      throw new HttpError(409, "This complaint is resolved and closed; its priority can no longer change.");
    }

    const complaint = await prisma.complaint.update({
      where: { id },
      data: { priority: priority as Priority },
    });
    return json({ id: complaint.id, priority: complaint.priority });
  } catch (error) {
    return handleError(error);
  }
}
