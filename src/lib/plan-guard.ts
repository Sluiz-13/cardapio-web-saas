import { db } from "@/lib/db";
import { getLimit } from "@/lib/plan-features";

type LimitedFeature = "maxProducts" | "maxCategories" | "maxAdminUsers";

export async function assertUnderPlanLimit(
  restaurantId: string,
  feature: LimitedFeature
): Promise<{ ok: true } | { ok: false; message: string }> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { plan: true },
  });
  if (!restaurant) return { ok: false, message: "Restaurante não encontrado." };

  const limit = getLimit(restaurant.plan, feature);
  if (limit === null) return { ok: true }; // ilimitado no plano atual

  const count =
    feature === "maxProducts"
      ? await db.product.count({ where: { restaurantId } })
      : feature === "maxCategories"
      ? await db.category.count({ where: { restaurantId } })
      : await db.adminUser.count({ where: { restaurantId } });

  if (count >= limit) {
    return {
      ok: false,
      message: `Limite do plano atual atingido (${limit}). Faça upgrade para o plano Pro para continuar.`,
    };
  }
  return { ok: true };
}