"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, CATEGORY_LABELS, MAX_PHOTO_BYTES } from "@/lib/constants";

export default function NewComplaintForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [preview, setPreview] = useState<string | null>(null);

  function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return setPreview(null);
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo must be 5 MB or smaller.");
      event.target.value = "";
      return setPreview(null);
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});

    // Sent as multipart so the optional photo rides along with the fields.
    const response = await fetch("/api/complaints", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "Could not submit your complaint. Please try again.");
      setFieldErrors(data.details ?? {});
      setPending(false);
      return;
    }

    router.push(`/complaints/${data.id}`);
    router.refresh();
  }

  const err = (name: string) => fieldErrors[name]?.[0];

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6" noValidate>
      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div>
        <label className="label" htmlFor="category">
          Category
        </label>
        <select id="category" name="category" className="input" defaultValue="" required>
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        {err("category") && <p className="field-error">{err("category")}</p>}
      </div>

      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          className="input"
          placeholder="Water leakage from bathroom ceiling"
          maxLength={120}
          required
        />
        {err("title") && <p className="field-error">{err("title")}</p>}
      </div>

      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className="input resize-y"
          placeholder="Describe the problem, where it is, and how long it has been happening."
          maxLength={2000}
          required
        />
        {err("description") && <p className="field-error">{err("description")}</p>}
      </div>

      <div>
        <label className="label" htmlFor="photo">
          Photo <span className="font-normal text-muted">(optional, JPEG/PNG/WebP, max 5 MB)</span>
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPhotoChange}
          className="input file:mr-3 file:rounded-md file:border-0 file:bg-canvas file:px-3 file:py-1 file:text-sm file:text-ink"
        />
        {preview && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview}
            alt="Selected complaint photo"
            className="mt-3 max-h-56 rounded-lg border border-line object-contain"
          />
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Submitting…" : "Submit complaint"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={pending}>
          Cancel
        </button>
      </div>
    </form>
  );
}
