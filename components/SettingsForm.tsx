"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Admin control for the configurable overdue threshold. */
export default function SettingsForm({ initialDays }: { initialDays: number }) {
  const router = useRouter();
  const [days, setDays] = useState(String(initialDays));
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overdueThresholdDays: Number(days) }),
    });
    setPending(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.details?.overdueThresholdDays?.[0] ?? data.error ?? "The setting could not be saved.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-lg space-y-4 p-5">
      <div>
        <label className="label" htmlFor="threshold">
          Overdue threshold (days)
        </label>
        <input
          id="threshold"
          type="number"
          min={1}
          max={365}
          className="input"
          value={days}
          onChange={(e) => {
            setDays(e.target.value);
            setSaved(false);
          }}
          required
        />
        <p className="mt-1.5 text-xs text-muted">
          Any complaint still unresolved after this many days is treated as overdue and surfaces at the top of the
          complaint queue. Because overdue status is calculated when complaints are read, changing this value takes
          effect immediately across every complaint.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {saved && (
        <p className="rounded-lg border border-resolved/20 bg-resolved-soft px-3 py-2 text-sm text-resolved">
          Threshold saved.
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save threshold"}
      </button>
    </form>
  );
}
