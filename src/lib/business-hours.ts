type BusinessHour = { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string };

export function isRestaurantOpenNow(
  manualOverrideOpen: boolean,
  businessHours: BusinessHour[],
  now: Date = new Date()
): boolean {
  if (!manualOverrideOpen) return false;

  const today = businessHours.find((h) => h.dayOfWeek === now.getDay());
  if (!today || !today.isOpen) return false;

  const [openH, openM] = today.openTime.split(":").map(Number);
  const [closeH, closeM] = today.closeTime.split(":").map(Number);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Suporta horário que passa da meia-noite (ex: 18:00 às 02:00)
  if (closeMinutes <= openMinutes) {
    return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
  }
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}