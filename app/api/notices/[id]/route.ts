import { handleError, json, HttpError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNoticeSchema } from "@/lib/validation";

/** PATCH /api/notices/:id - admin edits a notice or toggles its pinned state. */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser("ADMIN");
    const { id } = await ctx.params;
    const data = createNoticeSchema.partial().parse(await request.json());

    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Notice not found");

    const notice = await prisma.notice.update({ where: { id }, data });
    return json(notice);
  } catch (error) {
    return handleError(error);
  }
}

/** DELETE /api/notices/:id */
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser("ADMIN");
    const { id } = await ctx.params;

    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Notice not found");

    await prisma.notice.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
