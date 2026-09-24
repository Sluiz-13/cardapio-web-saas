import { db } from "@/lib/db";

export async function resolveDeliveryFee(
  restaurantId: string,
  neighborhood: string,
  defaultFeeCents: number
): Promise<{ feeCents: number; disabled: boolean }> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { useDeliveryZones: true },
  });

  if (restaurant?.useDeliveryZones) {
    const zones = await db.deliveryZone.findMany({
      where: { restaurantId },
      select: { neighborhoods: true, feeCents: true, active: true },
    });
    const rows = zones.flatMap((z) =>
      z.neighborhoods.map((n) => ({ neighborhood: n, feeCents: z.feeCents, active: z.active }))
    );
    return matchDeliveryFee(neighborhood, rows, defaultFeeCents);
  }

  const fees = await db.deliveryFee.findMany({
    where: { restaurantId },
    select: { neighborhood: true, feeCents: true, active: true },
  });
  return matchDeliveryFee(neighborhood, fees, defaultFeeCents);
}

export function normalizeNeighborhood(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .trim()
    .toLowerCase();
}

export function matchDeliveryFee(
  neighborhoodInput: string,
  fees: { neighborhood: string; feeCents: number; active?: boolean }[],
  defaultFeeCents: number
): { feeCents: number; disabled: boolean } {
  const normalizedInput = normalizeNeighborhood(neighborhoodInput);
  const match = fees.find((f) => normalizeNeighborhood(f.neighborhood) === normalizedInput);
  if (!match) return { feeCents: defaultFeeCents, disabled: false };
  return { feeCents: match.feeCents, disabled: match.active === false };
}