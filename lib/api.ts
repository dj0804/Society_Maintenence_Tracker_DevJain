import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Single translation point from thrown errors to HTTP responses, so route
 * handlers can stay linear and just throw.
 */
export function handleError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  console.error("[api] unhandled error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
