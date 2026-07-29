import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Toda rota /api/admin/* deve chamar isso antes de tocar no banco.
 * Retorna null se não autenticado — o caller decide o response 401.
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;
  return session;
}