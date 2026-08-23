import { handleError, json } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { getOverdueThresholdDays, setOverdueThresholdDays } from "@/lib/overdue";
import { settingsSchema } from "@/lib/validation";

/** GET /api/settings - current overdue threshold. */
export async function GET() {
  try {
    await requireApiUser();
    return json({ overdueThresholdDays: await getOverdueThresholdDays() });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/settings - admin changes the overdue threshold. Because overdue is
 * derived at read time, the new value takes effect immediately for every
 * complaint; no backfill is needed.
 */
export async function PUT(request: Request) {
  try {
    await requireApiUser("ADMIN");
    const { overdueThresholdDays } = settingsSchema.parse(await request.json());
    await setOverdueThresholdDays(overdueThresholdDays);
    return json({ overdueThresholdDays });
  } catch (error) {
    return handleError(error);
  }
}
