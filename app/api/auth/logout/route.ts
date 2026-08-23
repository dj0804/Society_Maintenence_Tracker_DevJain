import { clearSessionCookie } from "@/lib/auth";
import { handleError, json } from "@/lib/api";

/** POST /api/auth/logout */
export async function POST() {
  try {
    await clearSessionCookie();
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
