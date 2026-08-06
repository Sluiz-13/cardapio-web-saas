import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes } from "react";
import clsx from "clsx";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={clsx("block text-xs font-semibold uppercase tracking-wide mb-1.5 text-gray-400", className)}
      {...props}
    />
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <div className="mb-4">
    <input
      ref={ref}
      className={clsx(
        "w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm transition-shadow duration-[180ms]",
        "focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand",
        error ? "border-red-300" : "border-surface-border",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
));
Input.displayName = "Input";