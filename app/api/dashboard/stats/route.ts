import { handleError, json } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard";

/** GET /api/dashboard/stats - admin-only complaint totals by status/category. */
export async function GET() {
  try {
    await requireApiUser("ADMIN");
    return json(await getDashboardStats());
  } catch (error) {
    return handleError(error);
  }
}
