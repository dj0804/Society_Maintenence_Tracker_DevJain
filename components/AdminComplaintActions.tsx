"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ComplaintStatus, Priority } from "@prisma/client";
import { PRIORITIES, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";

/**
 * Admin controls for one complaint: move it along the lifecycle with a note,
 * set its priority, and flag it overdue ahead of the age threshold.
 * A resolved complaint is closed, so every control is disabled.
 */
export default function AdminComplaintActions({
  complaintId,
  status,
  priority,
  isOverdueFlagged,
  allowedNextStatuses,
}: {
  complaintId: string;
  status: ComplaintStatus;
  priority: Priority;
  isOverdueFlagged: boolean;
  allowedNextStatuses: ComplaintStatus[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<string>(allowedNextStatuses[0] ?? "");
  const [note, setNote] = useState("");

  const closed = status === "RESOLVED";

  async function send(action: string, url: string, body: unknown) {
    setPending(action);
    setError(null);
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "That change could not be saved.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function submitStatus(event: React.FormEvent) {
    event.preventDefault();
    if (!nextStatus) return;
    const ok = await send("status", `/api/complaints/${complaintId}/status`, { status: nextStatus, note });
    if (ok) setNote("");
  }

  if (closed) {
    return (
      <section className="card p-5">
        <h2 className="mb-2 text-sm font-semibold">Admin actions</h2>
        <p className="text-sm text-muted">
          This complaint is resolved and closed. Its status and priority can no longer be changed.
        </p>
      </section>
    );
  }

  return (
    <section className="card p-5">
      <h2 className="mb-4 text-sm font-semibold">Admin actions</h2>

      {error && (
        <p className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={submitStatus} className="space-y-3">
        <div>
          <label className="label text-xs" htmlFor="next-status">
            Move to status
          </label>
          <select
            id="next-status"
            className="input py-1.5"
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
          >
            {allowedNextStatuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-xs" htmlFor="status-note">
            Note <span className="font-normal text-muted">(optional, shown to the resident)</span>
          </label>
          <textarea
            id="status-note"
            rows={3}
            className="input resize-y"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Plumber assigned, visiting tomorrow morning."
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={pending !== null}>
          {pending === "status" ? "Updating…" : "Update status"}
        </button>
        {nextStatus === "RESOLVED" && (
          <p className="text-xs text-muted">Resolving closes the complaint permanently.</p>
        )}
      </form>

      <div className="mt-5 border-t border-line pt-5">
        <p className="label text-xs">Priority</p>
        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              disabled={pending !== null}
              onClick={() => send("priority", `/api/complaints/${complaintId}/priority`, { priority: p })}
              className={`btn px-2 py-1.5 text-xs ${
                p === priority
                  ? "bg-ink text-white"
                  : "border border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <p className="label text-xs">Overdue flag</p>
        <p className="mb-2 text-xs text-muted">
          Complaints age into overdue automatically. Flag one manually to escalate it sooner.
        </p>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() =>
            send("flag", `/api/complaints/${complaintId}/overdue-flag`, { isOverdueFlagged: !isOverdueFlagged })
          }
          className={isOverdueFlagged ? "btn-secondary w-full" : "btn-danger w-full"}
        >
          {isOverdueFlagged ? "Clear overdue flag" : "Flag as overdue"}
        </button>
      </div>
    </section>
  );
}
