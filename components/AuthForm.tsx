"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";

/** Field-level errors returned by the API's Zod validation. */
type FieldErrors = Record<string, string[] | undefined>;

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});

    const payload = Object.fromEntries(new FormData(event.currentTarget));

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setFieldErrors(data.details ?? {});
      setPending(false);
      return;
    }

    const next = params.get("next");
    router.replace(next ?? (data.role === "ADMIN" ? "/admin" : "/complaints"));
    router.refresh();
  }

  const err = (name: string) => fieldErrors[name]?.[0];

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {mode === "register" && (
        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input id="name" name="name" className="input" placeholder="Rhea Menon" required />
          {err("name") && <p className="field-error">{err("name")}</p>}
        </div>
      )}

      <div>
        <label className="label" htmlFor="email">
          Email address
        </label>
        <input id="email" name="email" type="email" className="input" placeholder="you@example.com" required />
        {err("email") && <p className="field-error">{err("email")}</p>}
      </div>

      {mode === "register" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="flatNumber">
              Flat number
            </label>
            <input id="flatNumber" name="flatNumber" className="input" placeholder="A-1203" required />
            {err("flatNumber") && <p className="field-error">{err("flatNumber")}</p>}
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="phone" name="phone" className="input" placeholder="+91 98200 11111" />
            {err("phone") && <p className="field-error">{err("phone")}</p>}
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
          required
        />
        {err("password") && <p className="field-error">{err("password")}</p>}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            New to the society portal?{" "}
            <Link href="/register" className="font-medium text-brand hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already registered?{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
