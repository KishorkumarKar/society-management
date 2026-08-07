interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  const titleColor = tone === "light" ? "text-paper" : "text-ink";
  const descColor = tone === "light" ? "text-paper/70" : "text-ink/60";

  return (
    <div className={`flex flex-col gap-3 ${alignClass}`}>
      {eyebrow && (
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
          {eyebrow}
        </span>
      )}
      <h2 className={`font-display text-3xl font-medium leading-tight sm:text-4xl ${titleColor}`}>
        {title}
      </h2>
      {description && (
        <p className={`max-w-2xl text-base leading-relaxed ${descColor}`}>
          {description}
        </p>
      )}
    </div>
  );
}
