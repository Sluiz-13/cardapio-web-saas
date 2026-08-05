import type { Plan } from "@prisma/client";

export const PLAN_PRICE_CENTS: Record<Plan, number> = {
  START: 10000, // R$ 100,00
  PRO: 15900, // R$ 159,00
};