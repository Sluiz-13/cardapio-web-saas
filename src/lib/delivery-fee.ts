export function normalizeNeighborhood(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .trim()
    .toLowerCase();
}

export function matchDeliveryFee(
  neighborhoodInput: string,
  fees: { neighborhood: string; feeCents: number }[],
  defaultFeeCents: number
): number {
  const normalizedInput = normalizeNeighborhood(neighborhoodInput);
  const match = fees.find((f) => normalizeNeighborhood(f.neighborhood) === normalizedInput);
  return match ? match.feeCents : defaultFeeCents;
}