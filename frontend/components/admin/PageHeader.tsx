import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
        {description && <p className="text-sm text-ink/50">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
