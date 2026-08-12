import type { Plan } from "@prisma/client";

export const PLAN_LIMITS: Record<
  Plan,
  {
    maxProducts: number | null;
    maxCategories: number | null;
    maxAdminUsers: number | null;
    coupons: boolean;
    soundNotifications: boolean;
    csvExport: boolean;
    featuredProducts: boolean;
    permissionsControl: boolean;
    realtimeUpdates: boolean;
    onDemandBackup: boolean;
    dashboard: boolean;
    reports: boolean;
  }
> = {
  START: {
    maxProducts: 150,
    maxCategories: 15,
    maxAdminUsers: 1,
    coupons: false,
    soundNotifications: true,
    csvExport: false,
    featuredProducts: false,
    permissionsControl: false,
    realtimeUpdates: false,
    onDemandBackup: false,
    dashboard: false,
    reports: false,
  },
  PRO: {
    maxProducts: null,
    maxCategories: null,
    maxAdminUsers: null,
    coupons: true,
    soundNotifications: true,
    csvExport: true,
    featuredProducts: true,
    permissionsControl: true,
    realtimeUpdates: true,
    onDemandBackup: true,
    dashboard: true,
    reports: true,
  },
};

export type BooleanPlanFeature = Exclude<
  keyof (typeof PLAN_LIMITS)["START"],
  "maxProducts" | "maxCategories" | "maxAdminUsers"
>;

export function planAllows(plan: Plan, feature: BooleanPlanFeature): boolean {
  return PLAN_LIMITS[plan][feature];
}

export function getLimit(plan: Plan, feature: "maxProducts" | "maxCategories" | "maxAdminUsers"): number | null {
  return PLAN_LIMITS[plan][feature];
}

export const UPGRADE_MESSAGE = "Esse recurso é exclusivo do plano Pro. Faça upgrade para desbloquear.";