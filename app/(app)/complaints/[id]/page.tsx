import { notFound, redirect } from "next/navigation";
import ComplaintDetail from "@/components/ComplaintDetail";
import { requirePageUser } from "@/lib/auth";
import { getOverdueThresholdDays } from "@/lib/overdue";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Complaint | Society Maintenance Tracker" };

export default async function ComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePageUser();
  const { id } = await params;
  if (session.role === "ADMIN") redirect(`/admin/complaints/${id}`);

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

  // A resident may only see their own complaint; anything else is a 404.
  if (!complaint || complaint.residentId !== session.userId) notFound();

  return (
    <ComplaintDetail
      complaint={complaint}
      thresholdDays={await getOverdueThresholdDays()}
      backHref="/complaints"
      backLabel="Back to my complaints"
    />
  );
}
