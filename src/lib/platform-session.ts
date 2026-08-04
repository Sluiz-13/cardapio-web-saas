import { getServerSession } from "next-auth";
import { platformAuthOptions } from "@/lib/platform-auth";

/**
 * Toda rota /api/platform/* deve chamar isso antes de tocar no banco.
 * Retorna null se não autenticado como PlatformAdmin — o caller decide o 401.
 */
export async function getPlatformSession() {
  const session = await getServerSession(platformAuthOptions);
  if (!(session?.user as any)?.isPlatformAdmin) return null;
  return session;
}