import { handleError, json } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { notifyImportantNotice } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { createNoticeSchema } from "@/lib/validation";

/** GET /api/notices - the notice board, important notices pinned to the top. */
export async function GET() {
  try {
    await requireApiUser();
    const notices = await prisma.notice.findMany({
      orderBy: [{ isImportant: "desc" }, { createdAt: "desc" }],
      include: { postedBy: { select: { id: true, name: true } } },
    });
    return json({ notices });
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/notices - admin posts a notice; important ones email all residents. */
export async function POST(request: Request) {
  try {
    const session = await requireApiUser("ADMIN");
    const data = createNoticeSchema.parse(await request.json());

    const notice = await prisma.notice.create({
      data: { ...data, postedById: session.userId },
    });

    if (notice.isImportant) {
      await notifyImportantNotice({ title: notice.title, body: notice.body });
    }

    return json(notice, 201);
  } catch (error) {
    return handleError(error);
  }
}
