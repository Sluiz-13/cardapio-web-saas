import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Duas sessões completamente separadas nesse app:
 * - /admin/*    → dono/staff de restaurante (cookie padrão do NextAuth, ver src/lib/auth.ts)
 * - /platform/* → dono da plataforma SaaS (cookie "platform-session-token", ver src/lib/platform-auth.ts)
 *
 * Nunca devem se misturar: um token de admin de restaurante não autentica
 * em /platform, e vice-versa.
 */
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

  // /admin/* — comportamento igual ao que já existia com withAuth
  const token = await getToken({ req, secret });
  if (!token) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  // protege tudo em /admin (exceto login) e tudo em /platform (exceto login)
  matcher: ["/admin/((?!login).*)", "/platform/((?!login).*)"],
};