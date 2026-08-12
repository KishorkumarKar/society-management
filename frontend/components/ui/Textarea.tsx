import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
}

export default function Textarea({ label, id, className = "", ...rest }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-wider text-ink/60">
        {label}
      </label>
      <textarea
        id={id}
        className={`resize-none rounded-sm border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass ${className}`}
        {...rest}
      />
    </div>
  );
}
