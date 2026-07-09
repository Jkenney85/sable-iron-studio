import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Edge middleware guarding the admin area. It only verifies the session JWT
// signature (no DB access at the edge); full authorization/roles are enforced
// again in server components and API handlers.

const SESSION_COOKIE = "si_admin_session";

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin, but always allow the login page + admin auth endpoints.
  const isLogin = pathname === "/admin/login";
  const isAuthApi = pathname.startsWith("/api/admin/auth");
  if (isLogin || isAuthApi) return NextResponse.next();

  const guarded =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!guarded) return NextResponse.next();

  const valid = await isValidSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (valid) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
