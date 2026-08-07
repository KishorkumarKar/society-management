import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
}

export default function Select({ label, id, children, className = "", ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-wider text-ink/60">
        {label}
      </label>
      <select
        id={id}
        className={`rounded-sm border border-ink/15 bg-paper px-4 py-3 text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
