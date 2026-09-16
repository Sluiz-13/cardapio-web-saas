import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { isAdminRouteAllowed } from "@/lib/admin-permissions";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET;

  if (pathname.startsWith("/platform")) {
    const token = await getToken({
      req,
      secret,
      cookieName: "platform-session-token",
    });
    if (!token) {
      const loginUrl = new URL("/platform/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const token = await getToken({ req, secret });
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token.role as string) ?? "STAFF";
  if (!isAdminRouteAllowed(role, pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/((?!login).*)", "/platform/((?!login).*)", "/api/admin/:path*"],
};