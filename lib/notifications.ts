import type { ComplaintStatus } from "@prisma/client";
import { importantNoticeEmail, statusChangeEmail } from "@/emails/templates";
import { sendMail } from "./email";
import { prisma } from "./prisma";

/** Emails the resident when their complaint's status changes. */
export async function notifyStatusChange(params: {
  to: string;
  residentName: string;
  ticketNo: string;
  title: string;
  from: ComplaintStatus;
  toStatus: ComplaintStatus;
  note?: string | null;
  complaintId: string;
}): Promise<void> {
  const mail = statusChangeEmail({
    residentName: params.residentName,
    ticketNo: params.ticketNo,
    title: params.title,
    from: params.from,
    to: params.toStatus,
    note: params.note,
    complaintId: params.complaintId,
  });
  await sendMail({ to: params.to, ...mail });
}

/** Emails every resident when an important notice is posted. */
export async function notifyImportantNotice(notice: { title: string; body: string }): Promise<void> {
  const residents = await prisma.user.findMany({
    where: { role: "RESIDENT" },
    select: { email: true },
  });
  if (residents.length === 0) return;
  const mail = importantNoticeEmail(notice);
  await sendMail({ to: residents.map((r) => r.email), ...mail });
}
