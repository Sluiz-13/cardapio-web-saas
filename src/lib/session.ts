import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

type AdminSession = Session & {
  user: Session["user"] & {
    restaurantId: string;
    role: "OWNER" | "STAFF";
  };
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;
  return session as AdminSession;
}