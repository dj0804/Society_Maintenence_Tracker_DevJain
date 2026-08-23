import { Resend } from "resend";

type Mail = { to: string | string[]; subject: string; html: string };

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function appUrl(pathname = "/"): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}${pathname}`;
}

/**
 * Sends an email, or logs it when RESEND_API_KEY is unset so the app is fully
 * usable without an email account. Never throws: a failed notification must not
 * fail the request that triggered it.
 */
export async function sendMail({ to, subject, html }: Mail): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0) return;

  if (!resend) {
    console.info(`[email:dry-run] to=${recipients.join(", ")} subject="${subject}"`);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.MAIL_FROM ?? "Society Tracker <onboarding@resend.dev>",
      to: recipients,
      subject,
      html,
    });
  } catch (error) {
    console.error("[email] send failed:", error);
  }
}
