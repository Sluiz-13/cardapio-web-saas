import { type LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-light text-brand shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}