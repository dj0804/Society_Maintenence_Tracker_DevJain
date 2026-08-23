import bcrypt from "bcryptjs";
import { handleError, json, HttpError } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

/** POST /api/auth/login */
export async function POST(request: Request) {
  try {
    const { email, password } = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email } });
    // Same message either way, so the response cannot be used to enumerate accounts.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, "Incorrect email or password.");
    }

    await setSessionCookie({ userId: user.id, role: user.role, name: user.name, email: user.email });

    return json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    return handleError(error);
  }
}
