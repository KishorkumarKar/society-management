import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export default function Input({ label, id, className = "", ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-wider text-ink/60">
        {label}
      </label>
      <input
        id={id}
        className={`rounded-sm border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass ${className}`}
        {...rest}
      />
    </div>
  );
}
