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
    // Chamada de API sem sessão devolve 401 (JSON) — nunca redireciona,
    // senão o teste (e qualquer cliente de API de verdade) recebe uma
    // página HTML de login em vez de um erro claro. Só requisição de
    // PÁGINA (alguém abrindo /admin no navegador) cai na tela de login.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
  // STAFF (garçom) não tem acesso a NENHUMA rota /api/admin/* — a área dele
  // é só /api/garcom/*. Isso bloqueia mesmo que a pessoa chame a rota
  // direto (devtools, curl), não só o link sumindo da tela. A tela do
  // painel completo (/admin/(protected)) já é bloqueada separadamente no
  // layout.tsx — aqui é a segunda camada, cobrindo a API.
  if (pathname.startsWith("/api/admin") && token.role === "STAFF") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  // protege tudo em /admin (exceto login), tudo em /platform (exceto login),
  // e intercepta /api/admin pra checar o papel do usuário.
  matcher: ["/admin/((?!login).*)", "/platform/((?!login).*)", "/api/admin/:path*"],
};