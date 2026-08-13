import { getBrazilTimeParts } from "./timezone";

type BusinessHour = { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string };

export function isRestaurantOpenNow(
  manualOverrideOpen: boolean,
  businessHours: BusinessHour[],
  now: Date = new Date()
): boolean {
  if (!manualOverrideOpen) return false;

  const { dayOfWeek, hours, minutes } = getBrazilTimeParts(now);

  const today = businessHours.find((h) => h.dayOfWeek === dayOfWeek);
  if (!today || !today.isOpen) return false;

  const [openH, openM] = today.openTime.split(":").map(Number);
  const [closeH, closeM] = today.closeTime.split(":").map(Number);

  const nowMinutes = hours * 60 + minutes;
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;


  if (closeMinutes <= openMinutes) {
    return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
  }
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}