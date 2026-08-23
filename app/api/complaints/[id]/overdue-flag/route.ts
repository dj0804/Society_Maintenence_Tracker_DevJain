import { handleError, json, HttpError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { flagOverdueSchema } from "@/lib/validation";

/**
 * PATCH /api/complaints/:id/overdue-flag - lets an admin mark a complaint
 * overdue ahead of the age threshold, or clear a manual flag.
 */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser("ADMIN");
    const { id } = await ctx.params;
    const { isOverdueFlagged } = flagOverdueSchema.parse(await request.json());

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Complaint not found");
    if (existing.status === "RESOLVED") {
      throw new HttpError(409, "A resolved complaint cannot be flagged overdue.");
    }

    const complaint = await prisma.complaint.update({ where: { id }, data: { isOverdueFlagged } });
    return json({ id: complaint.id, isOverdueFlagged: complaint.isOverdueFlagged });
  } catch (error) {
    return handleError(error);
  }
}
