import { Prisma } from "@prisma/client";
import { handleError, json } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { nextTicketNo } from "@/lib/complaints";
import { getOverdueThresholdDays, isOverdue, overdueWhere } from "@/lib/overdue";
import { prisma } from "@/lib/prisma";
import { saveComplaintPhoto } from "@/lib/storage";
import { createComplaintSchema } from "@/lib/validation";

/**
 * GET /api/complaints
 * Residents see only their own complaints. Admins see all, with optional
 * ?status= &category= &from= &to= &overdue=true filters.
 * Admin results are ordered overdue first, then by priority, then oldest first.
 */
export async function GET(request: Request) {
  try {
    const session = await requireApiUser();
    const params = new URL(request.url).searchParams;
    const threshold = await getOverdueThresholdDays();

    const where: Prisma.ComplaintWhereInput = {};
    if (session.role === "RESIDENT") where.residentId = session.userId;

    const status = params.get("status");
    const category = params.get("category");
    const from = params.get("from");
    const to = params.get("to");

    if (status) where.status = status as Prisma.ComplaintWhereInput["status"];
    if (category) where.category = category as Prisma.ComplaintWhereInput["category"];
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from + "T00:00:00.000Z") } : {}),
        ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
      };
    }
    if (params.get("overdue") === "true") {
      where.AND = [overdueWhere(threshold)];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        resident: { select: { id: true, name: true, flatNumber: true, email: true } },
        _count: { select: { history: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const decorated = complaints.map((c) => ({ ...c, isOverdue: isOverdue(c, threshold) }));

    // Admins triage: overdue first, then High -> Low, then oldest first.
    if (session.role === "ADMIN") {
      const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
      decorated.sort(
        (a, b) =>
          Number(b.isOverdue) - Number(a.isOverdue) ||
          rank[a.priority] - rank[b.priority] ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      );
    }

    return json({ thresholdDays: threshold, complaints: decorated });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/complaints - residents raise a complaint.
 * Accepts multipart/form-data so an optional photo can be attached.
 */
export async function POST(request: Request) {
  try {
    const session = await requireApiUser("RESIDENT");
    const form = await request.formData();

    const data = createComplaintSchema.parse({
      title: form.get("title"),
      description: form.get("description"),
      category: form.get("category"),
    });

    const photo = form.get("photo");
    let photoUrl: string | null = null;
    if (photo instanceof File && photo.size > 0) {
      photoUrl = await saveComplaintPhoto(photo);
    }

    const complaint = await prisma.$transaction(async (tx) => {
      const ticketNo = await nextTicketNo(tx);
      const created = await tx.complaint.create({
        data: {
          ticketNo,
          residentId: session.userId,
          category: data.category as Prisma.ComplaintCreateInput["category"],
          title: data.title,
          description: data.description,
          photoUrl,
        },
      });
      // Seed the audit trail so every complaint has a complete timeline.
      await tx.complaintStatusHistory.create({
        data: {
          complaintId: created.id,
          fromStatus: null,
          toStatus: "OPEN",
          note: "Complaint raised by resident",
          changedById: session.userId,
        },
      });
      return created;
    });

    return json(complaint, 201);
  } catch (error) {
    return handleError(error);
  }
}
