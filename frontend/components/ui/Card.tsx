import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-sm border border-ink/10 bg-paper text-ink shadow-pin ${className}`}
    >
      {children}
    </div>
  );
}
