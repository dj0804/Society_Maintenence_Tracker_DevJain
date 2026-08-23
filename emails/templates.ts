import { STATUS_LABELS } from "@/lib/constants";
import { appUrl } from "@/lib/email";
import type { ComplaintStatus } from "@prisma/client";

const wrap = (inner: string) => `
  <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f4f5f7;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb">
      <h1 style="margin:0 0 4px;font-size:17px;color:#0f172a">Society Maintenance Tracker</h1>
      <div style="height:1px;background:#e5e7eb;margin:16px 0"></div>
      ${inner}
      <div style="height:1px;background:#e5e7eb;margin:20px 0"></div>
      <p style="margin:0;font-size:12px;color:#94a3b8">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  </div>`;

export function statusChangeEmail(params: {
  residentName: string;
  ticketNo: string;
  title: string;
  from: ComplaintStatus;
  to: ComplaintStatus;
  note?: string | null;
  complaintId: string;
}) {
  const { residentName, ticketNo, title, from, to, note, complaintId } = params;
  return {
    subject: `[${ticketNo}] Status updated to ${STATUS_LABELS[to]}`,
    html: wrap(`
      <p style="font-size:14px;color:#334155">Hi ${residentName},</p>
      <p style="font-size:14px;color:#334155">
        Your complaint <strong>${ticketNo} &mdash; ${title}</strong> has moved from
        <strong>${STATUS_LABELS[from]}</strong> to <strong>${STATUS_LABELS[to]}</strong>.
      </p>
      ${note ? `<p style="font-size:14px;color:#334155;background:#f8fafc;border-left:3px solid #cbd5e1;padding:10px 12px;margin:16px 0"><strong>Note from admin:</strong><br/>${note}</p>` : ""}
      ${to === "RESOLVED" ? `<p style="font-size:14px;color:#334155">This complaint is now resolved and closed. Thank you for your patience.</p>` : ""}
      <p style="margin-top:20px">
        <a href="${appUrl(`/complaints/${complaintId}`)}"
           style="background:#0f172a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;display:inline-block">
          View complaint
        </a>
      </p>`),
  };
}

export function importantNoticeEmail(params: { title: string; body: string }) {
  return {
    subject: `Important notice: ${params.title}`,
    html: wrap(`
      <p style="font-size:12px;font-weight:600;color:#b91c1c;letter-spacing:.04em;margin:0 0 8px">IMPORTANT NOTICE</p>
      <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a">${params.title}</h2>
      <p style="font-size:14px;color:#334155;white-space:pre-wrap">${params.body}</p>
      <p style="margin-top:20px">
        <a href="${appUrl("/notices")}"
           style="background:#0f172a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;display:inline-block">
          Open notice board
        </a>
      </p>`),
  };
}
