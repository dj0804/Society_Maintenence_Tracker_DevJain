import { notFound } from "next/navigation";
import AdminComplaintActions from "@/components/AdminComplaintActions";
import ComplaintDetail from "@/components/ComplaintDetail";
import { requirePageUser } from "@/lib/auth";
import { allowedNextStatuses } from "@/lib/complaints";
import { getOverdueThresholdDays } from "@/lib/overdue";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Manage Complaint | Society Maintenance Tracker" };

export default async function AdminComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser("ADMIN");
  const { id } = await params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      resident: { select: { name: true, flatNumber: true, email: true, phone: true } },
      history: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { name: true, role: true } } },
      },
    },
  });

  if (!complaint) notFound();

  return (
    <ComplaintDetail
      complaint={complaint}
      thresholdDays={await getOverdueThresholdDays()}
      backHref="/admin/complaints"
      backLabel="Back to all complaints"
      actions={
        <AdminComplaintActions
          complaintId={complaint.id}
          status={complaint.status}
          priority={complaint.priority}
          isOverdueFlagged={complaint.isOverdueFlagged}
          allowedNextStatuses={allowedNextStatuses(complaint.status)}
        />
      }
    />
  );
}
