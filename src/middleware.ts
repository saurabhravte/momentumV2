import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth gate. Per Better Auth docs this only checks for the presence
 * of a session cookie (fast, edge-safe) — real validation happens in the
 * (app) layout via auth.api.getSession(). Good enough to redirect anonymous
 * users away from the product surface without a DB round-trip on every nav.
 */
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const isProtected = ["/inbox", "/calendar", "/settings"].some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );
  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/inbox/:path*", "/calendar/:path*", "/settings/:path*"],
};
