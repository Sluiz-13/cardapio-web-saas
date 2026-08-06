import { type TableHTMLAttributes, type HTMLAttributes } from "react";
import clsx from "clsx";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-surface-border bg-white shadow-sm">
      <table className={clsx("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function Thead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}
export function Tbody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}
export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={clsx("border-b border-gray-50 last:border-0", className)} {...props} />;
}
export function Th({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400 border-b border-surface-border",
        className
      )}
      {...props}
    />
  );
}
export function Td({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={clsx("px-4 py-3 text-gray-700", className)} {...props} />;
}