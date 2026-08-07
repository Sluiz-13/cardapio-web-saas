import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
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
        // Mesmo padrão já usado no login da plataforma (platform-auth.ts).
        const ip = (req?.headers?.["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? "unknown";
        const { allowed } = await rateLimit(`admin-login:${ip}:${credentials.email}`, 5, 5 * 60 * 1000);
        if (!allowed) return null;

        const admin = await db.adminUser.findUnique({
          where: { email: credentials.email },
          include: { restaurant: { select: { active: true } } },
        });
        if (!admin) return null;

        const validPassword = await bcrypt.compare(credentials.password, admin.passwordHash);
        if (!validPassword) return null;
        if (!admin.restaurant.active) return null;

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          restaurantId: admin.restaurantId,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = (user as any).id;
      token.restaurantId = (user as any).restaurantId;
      token.role = (user as any).role;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      (session.user as any).restaurantId = token.restaurantId;
      (session.user as any).role = token.role;
    }
    return session;
  },
},
};