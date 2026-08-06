import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Auth separada da autenticação de dono/staff de restaurante (src/lib/auth.ts).
 * Tabela própria (PlatformAdmin), cookie próprio — nunca deve se misturar
 * com a sessão de um AdminUser, mesmo no mesmo navegador/domínio.
 */
export const platformAuthOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/platform/login",
  },
  cookies: {
    sessionToken: {
      name: "platform-session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "platform-callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "platform-csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit por IP + e-mail tentado: 5 tentativas a cada 5 minutos.
        // Evita brute-force na conta de maior privilégio do sistema.
        const ip = (req?.headers?.["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? "unknown";
        const { allowed } = await rateLimit(`platform-login:${ip}:${credentials.email}`, 5, 5 * 60 * 1000);
        if (!allowed) return null;

        const admin = await db.platformAdmin.findUnique({
          where: { email: credentials.email },
        });
        if (!admin) return null;

        const validPassword = await bcrypt.compare(credentials.password, admin.passwordHash);
        if (!validPassword) return null;

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.isPlatformAdmin = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).isPlatformAdmin = true;
      }
      return session;
    },
  },
};