"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS, STATUS_LABELS, STATUSES } from "@/lib/constants";

/**
 * Filter bar for the admin complaint queue. Filters live in the URL, so the
 * server component re-queries and any filtered view is shareable.
 */
export default function ComplaintFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(next.toString() ? `${pathname}?${next}` : pathname);
  }

  const hasFilters = ["status", "category", "from", "to", "overdue"].some((k) => params.get(k));

  return (
    <div className="card mb-5 flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-36 flex-1">
        <label className="label text-xs" htmlFor="filter-status">
          Status
        </label>
        <select
          id="filter-status"
          className="input py-1.5"
          value={params.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-36 flex-1">
        <label className="label text-xs" htmlFor="filter-category">
          Category
        </label>
        <select
          id="filter-category"
          className="input py-1.5"
          value={params.get("category") ?? ""}
          onChange={(e) => update("category", e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-36 flex-1">
        <label className="label text-xs" htmlFor="filter-from">
          Raised from
        </label>
        <input
          id="filter-from"
          type="date"
          className="input py-1.5"
          value={params.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
        />
      </div>

      <div className="min-w-36 flex-1">
        <label className="label text-xs" htmlFor="filter-to">
          Raised until
        </label>
        <input
          id="filter-to"
          type="date"
          className="input py-1.5"
          value={params.get("to") ?? ""}
          onChange={(e) => update("to", e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 pb-2 text-sm whitespace-nowrap">
        <input
          type="checkbox"
          className="size-4 accent-[var(--color-brand)]"
          checked={params.get("overdue") === "true"}
          onChange={(e) => update("overdue", e.target.checked ? "true" : "")}
        />
        Overdue only
      </label>

      {hasFilters && (
        <button type="button" className="btn-secondary py-1.5" onClick={() => router.replace(pathname)}>
          Clear
        </button>
      )}
    </div>
  );
}
