import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function PlanDueBanner({ daysUntilDue }: { daysUntilDue: number }) {
  const overdue = daysUntilDue < 0;
  const dueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;
  if (!overdue && !dueSoon) return null;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 text-sm ${
        overdue
          ? "bg-red-50 text-red-800 border-b border-red-200"
          : "bg-amber-50 text-amber-800 border-b border-amber-200"
      }`}
    >
      <AlertTriangle size={15} className="shrink-0" />
      <span className="flex-1">
        {overdue
          ? `Sua mensalidade venceu há ${Math.abs(daysUntilDue)} dia(s). Regularize para evitar suspensão.`
          : `Sua mensalidade vence em ${daysUntilDue} dia(s).`}
      </span>
      <Link href="/admin/planos" className="font-semibold underline shrink-0">
        Pagar Agora
      </Link>
    </div>
  );
}