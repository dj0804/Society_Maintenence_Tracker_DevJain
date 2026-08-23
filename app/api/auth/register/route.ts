import bcrypt from "bcryptjs";
import { handleError, json, HttpError } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

/** POST /api/auth/register - self-registration, always creates a RESIDENT. */
export async function POST(request: Request) {
  try {
    const data = registerSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new HttpError(409, "An account with this email already exists.");

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 10),
        flatNumber: data.flatNumber,
        phone: data.phone || null,
        role: "RESIDENT",
      },
    });

    await setSessionCookie({ userId: user.id, role: user.role, name: user.name, email: user.email });

    return json({ id: user.id, name: user.name, email: user.email, role: user.role }, 201);
  } catch (error) {
    return handleError(error);
  }
}
