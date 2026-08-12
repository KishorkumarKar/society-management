import type { ComponentType } from "react";
import Card from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

export default function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-4 p-6">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
          {label}
        </span>
        <span className="font-display text-2xl text-ink">{value}</span>
        {hint && <span className="text-xs text-ink/50">{hint}</span>}
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brass/10 text-brass">
        <Icon size={18} strokeWidth={1.75} />
      </span>
    </Card>
  );
}
