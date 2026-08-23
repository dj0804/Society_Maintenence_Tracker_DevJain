import { handleError, json } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/auth/me - the signed-in user's profile. */
export async function GET() {
  try {
    const session = await requireApiUser();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true, flatNumber: true, phone: true, createdAt: true },
    });
    return json(user);
  } catch (error) {
    return handleError(error);
  }
}
