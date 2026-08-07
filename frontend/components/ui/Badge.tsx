import type { ReactNode } from "react";

type Tone = "brass" | "sage" | "rust" | "muted";

const tones: Record<Tone, string> = {
  brass: "bg-brass/15 text-brass-dark border-brass/30",
  sage: "bg-sage/15 text-sage border-sage/30",
  rust: "bg-rust/15 text-rust border-rust/30",
  muted: "bg-muted/10 text-muted border-muted/20",
};

export default function Badge({
  children,
  tone = "brass",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-mono uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
