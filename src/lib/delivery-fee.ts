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