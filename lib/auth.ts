import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { SESSION_COOKIE } from "./constants";
import { signSession, verifySession, type SessionPayload } from "./session";

/** Thrown by requireApiUser; translated to an HTTP response by lib/api.ts. */
export class AuthError extends Error {
  constructor(readonly status: 401 | 403, message: string) {
    super(message);
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * For API route handlers. Middleware already guards page routes, but every
 * handler re-checks here so the API is safe on its own.
 */
export async function requireApiUser(role?: Role): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError(401, "Authentication required");
  if (role && session.role !== role) throw new AuthError(403, "Insufficient permissions");
  return session;
}

/** For server components: redirects instead of throwing. */
export async function requirePageUser(role?: Role): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (role && session.role !== role) redirect(session.role === "ADMIN" ? "/admin" : "/complaints");
  return session;
}
