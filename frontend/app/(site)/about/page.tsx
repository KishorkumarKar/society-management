import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "About Us — SocietyLedger",
  description: "Why SocietyLedger exists and how it keeps societies organised.",
};

const VALUES = [
  {
    code: "V-01",
    title: "One register, not six spreadsheets",
    body: "Every society we work with started with a maintenance sheet, a WhatsApp group and a notice pinned in the lobby. We built the single place all three point to.",
  },
  {
    code: "V-02",
    title: "Committees change, records shouldn't vanish",
    body: "Managing committees rotate every year. The ledger, the notices and the member history stay put regardless of who's holding the keys.",
  },
  {
    code: "V-03",
    title: "Every society keeps its own book",
    body: "Data for one society is never visible to another, even though they share the same system. Access is scoped the moment you sign in.",
  },
];

const TIMELINE = [
  { year: "2021", label: "Started with one RWA in Pune keeping accounts on paper." },
  { year: "2023", label: "Crossed 40 societies onto a shared, secure console." },
  { year: "2026", label: "Serving societies across Pune, Bengaluru and Gurugram." },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-ink py-20">
        <Container className="flex flex-col gap-6">
          <span className="w-fit rounded-sm border border-brass/40 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-brass">
            About SocietyLedger
          </span>
          <h1 className="max-w-2xl font-display text-4xl font-medium text-paper sm:text-5xl">
            Built by people who once ran a society WhatsApp group at 11pm.
          </h1>
          <p className="max-w-xl text-lg text-paper/70">
            We started SocietyLedger after watching a committee treasurer
            reconcile a year of maintenance dues from three different
            notebooks. There had to be a better register.
          </p>
        </Container>
      </section>

      <section className="bg-paper py-20">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="What we believe"
            title="Three things every society deserves from its software"
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {VALUES.map((value) => (
              <div key={value.code} className="flex flex-col gap-3 rounded-sm border border-ink/10 bg-paper p-7 shadow-pin">
                <Badge tone="brass">{value.code}</Badge>
                <h3 className="font-display text-lg text-ink">{value.title}</h3>
                <p className="text-sm leading-relaxed text-ink/60">{value.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink py-20">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="How we got here"
            title="A short, honest timeline"
            tone="light"
          />
          <div className="flex flex-col divide-y divide-paper/10 border-y border-paper/10">
            {TIMELINE.map((item) => (
              <div key={item.year} className="flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:gap-8">
                <span className="font-display text-2xl text-brass sm:w-28">{item.year}</span>
                <span className="text-paper/70">{item.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
