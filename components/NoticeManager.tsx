"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Admin-side notice controls: post a new notice, pin/unpin an existing one,
 * or delete it. Posting an important notice emails every resident.
 */
export function NoticeComposer() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError(null);
    setFieldErrors({});

    const data = new FormData(form);
    const response = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        body: data.get("body"),
        isImportant: data.get("isImportant") === "on",
      }),
    });
    setPending(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "The notice could not be posted.");
      setFieldErrors(payload.details ?? {});
      return;
    }

    form.reset();
    router.refresh();
  }

  const err = (name: string) => fieldErrors[name]?.[0];

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h2 className="text-sm font-semibold">Post a notice</h2>

      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div>
        <label className="label text-xs" htmlFor="notice-title">
          Title
        </label>
        <input
          id="notice-title"
          name="title"
          className="input"
          placeholder="Water tank cleaning on Sunday"
          maxLength={120}
          required
        />
        {err("title") && <p className="field-error">{err("title")}</p>}
      </div>

      <div>
        <label className="label text-xs" htmlFor="notice-body">
          Notice
        </label>
        <textarea
          id="notice-body"
          name="body"
          rows={4}
          className="input resize-y"
          placeholder="Give residents the what, when and what they need to do."
          maxLength={4000}
          required
        />
        {err("body") && <p className="field-error">{err("body")}</p>}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="isImportant" className="mt-0.5 size-4 accent-[var(--color-brand)]" />
        <span>
          Mark as important
          <span className="block text-xs text-muted">
            Pins it to the top of the board and emails every resident.
          </span>
        </span>
      </label>

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Posting…" : "Post notice"}
      </button>
    </form>
  );
}

export function NoticeActions({ id, isImportant }: { id: string; isImportant: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function call(method: "PATCH" | "DELETE", body?: unknown) {
    setPending(true);
    await fetch(`/api/notices/${id}`, {
      method,
      ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => call("PATCH", { isImportant: !isImportant })}
        className="btn-secondary px-2.5 py-1 text-xs"
      >
        {isImportant ? "Unpin" : "Pin"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this notice? This cannot be undone.")) call("DELETE");
        }}
        className="btn-danger px-2.5 py-1 text-xs"
      >
        Delete
      </button>
    </div>
  );
}
