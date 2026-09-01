export const BILLING_CYCLE_DAYS = 30;
export const PAYMENT_GRACE_DAYS = 35; // usado só pro Super Admin marcar "Pendente"
export const DUE_SOON_WARNING_DAYS = 5;

export function getNextDueDate(lastPaymentConfirmedAt: Date | null, createdAt: Date): Date {
  const base = lastPaymentConfirmedAt ?? createdAt;
  const due = new Date(base);
  due.setDate(due.getDate() + BILLING_CYCLE_DAYS);
  return due;
}

export function getDaysUntilDue(dueDate: Date): number {
  const diffMs = dueDate.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}