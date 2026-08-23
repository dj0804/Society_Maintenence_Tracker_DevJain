import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";
import { verifySession } from "@/lib/session";

const ADMIN_PREFIX = "/admin";
const RESIDENT_PREFIXES = ["/complaints", "/notices"];
const GUEST_ONLY = ["/login", "/register"];

/**
 * Page-level route guard. API handlers re-check permissions themselves; this
 * only keeps users out of pages they cannot use.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  const home = session?.role === "ADMIN" ? "/admin" : "/complaints";

  if (session && GUEST_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  const needsAdmin = pathname.startsWith(ADMIN_PREFIX);
  const needsAuth = needsAdmin || RESIDENT_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsAuth && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (needsAdmin && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/complaints", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/complaints/:path*", "/notices/:path*", "/login", "/register"],
};
